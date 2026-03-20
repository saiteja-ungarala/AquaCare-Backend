const escapeHtml = (value: string): string =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

type ResetPasswordPageOptions = {
    token?: string;
    error?: string | null;
    message?: string | null;
    success?: boolean;
};

export const renderResetPasswordPage = ({
    token = '',
    error = null,
    message = null,
    success = false,
}: ResetPasswordPageOptions): string => {
    const heading = success ? 'Password updated' : 'Reset your password';
    const bodyMessage = success
        ? message || 'Your password has been reset successfully.'
        : 'Enter a new password to finish resetting your IonCare account.';

    if (success) {
        return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IonCare Password Reset</title>
</head>
<body>
  <main>
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(bodyMessage)}</p>
    <p>You can return to the IonCare app and sign in with your new password.</p>
  </main>
</body>
</html>`;
    }

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>IonCare Password Reset</title>
</head>
<body>
  <main>
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(bodyMessage)}</p>
    ${error ? `<p>${escapeHtml(error)}</p>` : ''}
    <form method="post" action="/reset-password">
      <input type="hidden" name="token" value="${escapeHtml(token)}">
      <label for="newPassword">New password</label>
      <input id="newPassword" name="newPassword" type="password" minlength="8" maxlength="72" required>
      <button type="submit">Update password</button>
    </form>
  </main>
</body>
</html>`;
};
