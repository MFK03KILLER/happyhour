// Fixes @capacitor-community/apple-sign-in 7.1.0 for this app. Runs on every
// `npm install` / `npm ci` (postinstall), so a fresh checkout on the Mac is fixed too.
//
// 1. Package.swift asks for capacitor-swift-pm 7.x, but Capacitor 8 pins 8.x;
//    Swift Package Manager cannot satisfy both.
// 2. Plugin.swift starts Apple's sign-in sheet from Capacitor's background queue
//    and never gives it a window. That fails with ASAuthorizationError 1000 -
//    App Review hit it on iPad (rejection of build 1.0 (2), Sept 2026).
//
// No release of the plugin fixes either (7.1.0 is the latest), so this rewrites
// both files in node_modules. If the plugin is upgraded, the script stops
// patching and says so - check whether the new version still needs it.
import { existsSync, readFileSync, writeFileSync } from 'fs';

const DIR = 'node_modules/@capacitor-community/apple-sign-in';
const PATCHED_VERSION = '7.1.0';
const MARKER = '// Patched by customer-app/scripts/patch-apple-signin.mjs';

if (!existsSync(`${DIR}/package.json`)) {
  console.log('patch-apple-signin: plugin not installed - nothing to do');
  process.exit(0);
}
const { version } = JSON.parse(readFileSync(`${DIR}/package.json`, 'utf8'));
if (version !== PATCHED_VERSION) {
  console.warn(`patch-apple-signin: found ${version}, the patch targets ${PATCHED_VERSION} - not patching. Check whether the new version still needs it.`);
  process.exit(0);
}

const pkgFile = `${DIR}/Package.swift`;
const pkg = readFileSync(pkgFile, 'utf8');
if (pkg.includes('capacitor-swift-pm.git", from: "7.0.0"')) {
  writeFileSync(pkgFile, pkg.replace('capacitor-swift-pm.git", from: "7.0.0"', 'capacitor-swift-pm.git", from: "8.0.0"'));
  console.log('patch-apple-signin: Package.swift now accepts Capacitor 8');
}

const pluginFile = `${DIR}/ios/Sources/SignInWithApple/Plugin.swift`;
if (readFileSync(pluginFile, 'utf8').includes(MARKER)) {
  console.log('patch-apple-signin: Plugin.swift already patched');
  process.exit(0);
}

writeFileSync(pluginFile, `import Foundation
import UIKit
import WebKit
import Capacitor
import AuthenticationServices

${MARKER}
// Runs Apple's sheet on the main thread, anchors it to the app's window (needed
// on iPad) and passes the native error code to JavaScript (1001 = cancelled).
@objc(SignInWithApple)
public class SignInWithApple: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SignInWithApple"
    public let jsName = "SignInWithApple"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "authorize", returnType: CAPPluginReturnPromise),
    ]

    // The call waiting for Apple's answer; only one sheet can be open at a time.
    private var pendingCall: CAPPluginCall?

    @objc func authorize(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.pendingCall?.reject("Replaced by a newer sign-in request", "SUPERSEDED")
            self.pendingCall = call

            let request = ASAuthorizationAppleIDProvider().createRequest()
            request.requestedScopes = self.getRequestedScopes(from: call)
            request.state = call.getString("state")
            request.nonce = call.getString("nonce")

            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }

    func getRequestedScopes(from call: CAPPluginCall) -> [ASAuthorization.Scope]? {
        var scopes: [ASAuthorization.Scope] = []
        if let requested = call.getString("scopes") {
            if requested.contains("name") { scopes.append(.fullName) }
            if requested.contains("email") { scopes.append(.email) }
        }
        return scopes.isEmpty ? nil : scopes
    }

    fileprivate func takePendingCall() -> CAPPluginCall? {
        let call = pendingCall
        pendingCall = nil
        return call
    }
}

extension SignInWithApple: ASAuthorizationControllerDelegate {
    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let call = takePendingCall() else { return }
        guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
              let tokenData = credential.identityToken,
              let identityToken = String(data: tokenData, encoding: .utf8) else {
            call.reject("Apple did not return an identity token", "NO_TOKEN")
            return
        }
        var response: [String: Any] = ["user": credential.user, "identityToken": identityToken]
        if let email = credential.email { response["email"] = email }
        if let givenName = credential.fullName?.givenName { response["givenName"] = givenName }
        if let familyName = credential.fullName?.familyName { response["familyName"] = familyName }
        if let codeData = credential.authorizationCode, let code = String(data: codeData, encoding: .utf8) {
            response["authorizationCode"] = code
        }
        call.resolve(["response": response])
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        guard let call = takePendingCall() else { return }
        call.reject(error.localizedDescription, String((error as NSError).code), error)
    }
}

extension SignInWithApple: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        if let window = bridge?.webView?.window { return window }
        let windows = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
        return windows.first(where: { $0.isKeyWindow }) ?? windows.first ?? ASPresentationAnchor()
    }
}
`);
console.log('patch-apple-signin: Plugin.swift patched (main thread + iPad window + error codes)');
