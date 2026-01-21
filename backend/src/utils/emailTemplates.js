

module.exports.EMAIL_VERIFY_TEMPLATE = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Email Verify</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    body { margin: 0; padding: 0; font-family: 'Open Sans', sans-serif; background: #E5E5E5; }
    table, td { border-collapse: collapse; }
    .container { width: 100%; max-width: 500px; margin: 70px 0px; background-color: #ffffff; }
    .main-content { padding: 48px 30px 40px; color: #000000; }
    .button { width: 100%; background: #22D172; text-decoration: none; display: inline-block; padding: 10px 0; color: #fff; font-size: 14px; text-align: center; font-weight: bold; border-radius: 7px; }
    @media only screen and (max-width: 480px) { .container { width: 80% !important; } .button { width: 50% !important; } }
  </style>
</head>
<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center" bgcolor="#F6FAFB">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="main-content">
                  <table width="100%" cellspacing="0" cellpadding="0" border="0">
                    <tbody>
                      <tr>
                        <td style="padding: 0 0 24px; font-size: 18px; line-height: 150%; font-weight: bold;">
                          Verify your email
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px; font-size: 14px; line-height: 150%;">
                          You are just one step away to verify your account for this email: <span style="color: #4C83EE;">{{email}}</span>.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 16px; font-size: 14px; line-height: 150%; font-weight: 700;">
                          Use below OTP to verify your account.
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 24px;">
                          <p class="button" >{{otp}}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px; font-size: 14px; line-height: 150%;">
                          This OTP is valid for 10 minutes.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;


module.exports.PASSWORD_RESET_TEMPLATE = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Open Sans', sans-serif; background: #E5E5E5; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 50px auto; background: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
    .button { display: inline-block; background: #2563EB; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }
    h2 { color: #1F2937; }
    p { color: #4B5563; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>
    <p>Hello,</p>
    <p>We received a request to reset your password for your Royal Fitness account. If you didn't make this request, you can safely ignore this email.</p>
    <a href="{{reset_link}}" class="button">Reset Password</a>
    <p style="margin-top: 30px; font-size: 12px; color: #9CA3AF;">This link expires in 30 minutes.</p>
  </div>
</body>
</html>
`;