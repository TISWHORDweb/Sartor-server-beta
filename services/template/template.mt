<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sartor CRM</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100% !important;
                padding: 0 !important;
                border-radius: 0 !important;
            }
            .header-content {
                padding: 30px 20px !important;
            }
            .logo-container {
                margin-bottom: 20px !important;
            }
            .body-content {
                padding: 30px 20px !important;
            }
            .footer-content {
                padding: 25px 20px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafc; font-family: 'Plus Jakarta Sans', Arial, sans-serif;">
    <div class="email-container" style="max-width: 600px; margin: 30px auto; background: #ffffff; box-shadow: 0 5px 15px rgba(0,0,0,0.05); border-radius: 8px; overflow: hidden;">
        
        <!-- Header Section -->
        <div class="header-content" style="background: white; padding: 40px 40px 20px; text-align: center;">
            <div class="logo-container" style="margin-bottom: 15px;">
                <img src="https://res.cloudinary.com/dwua55lnu/image/upload/v1753376622/logo_kn8bxg.png" alt="Sartor CRM Logo" style="max-width: 160px; height: auto;">
            </div>
        </div>

        <!-- Body Content -->
        <div class="body-content" style="padding: 0 40px 40px; background: #ffffff;">
            <div style="position: relative; z-index: 2; color: #4a5568; line-height: 1.6;">
                {{body}}
            </div>
        </div>

        <!-- Footer Section -->
        <div class="footer-content" style="background: #f8f9fb; padding: 30px 40px; text-align: center; border-top: 1px solid #e2e8f0;">
            <div style="margin-bottom: 20px;">
                <span style="display: inline-block; background: #1a237e; padding: 8px 12px; border-radius: 6px; margin: 0 5px; color: white; font-size: 14px;">🛡️</span>
                <span style="display: inline-block; background: #1a237e; padding: 8px 12px; border-radius: 6px; margin: 0 5px; color: white; font-size: 14px;">📦</span>
                <span style="display: inline-block; background: #1a237e; padding: 8px 12px; border-radius: 6px; margin: 0 5px; color: white; font-size: 14px;">🧠</span>
            </div>
            
            <p style="margin: 0 0 15px 0; font-size: 14px; color: #718096;">
                Powered by Advanced Technology Solutions
            </p>
            
            <div style="padding-top: 15px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 12px; color: #a0aec0;">
                    © 2025 Sartor CRM. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>