// ===== EMAIL SERVICE FOR CROP REMINDERS =====
const nodemailer = require('nodemailer');

// ===== EMAIL CONFIGURATION =====
// Using Gmail SMTP - you can change this to your preferred email service
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can use 'outlook', 'yahoo', or custom SMTP
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com', // Your email
      pass: process.env.EMAIL_PASS || 'your-app-password' // Your app password
    }
  });
};

// ===== EMAIL TEMPLATES =====

// Template for crop registration confirmation
const getCropRegistrationTemplate = (farmerName, paddyType, plantedDate, landArea, fertilizationDate, harvestDate) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Crop Registration Confirmation</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #1B4F72; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .highlight { background-color: #e8f4fd; padding: 15px; border-left: 4px solid #1B4F72; margin: 20px 0; }
            .dates { background-color: #fff; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .reminder { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌾 HarvestEase</h1>
                <h2>Crop Registration Confirmed!</h2>
            </div>
            
            <div class="content">
                <p>Dear <strong>${farmerName}</strong>,</p>
                
                <p>Thank you for registering your crop with HarvestEase! Your ${paddyType} paddy cultivation has been successfully recorded in our system.</p>
                
                <div class="highlight">
                    <h3>📋 Your Crop Details:</h3>
                    <ul>
                        <li><strong>Paddy Type:</strong> ${paddyType}</li>
                        <li><strong>Planted Date:</strong> ${plantedDate}</li>
                        <li><strong>Land Area:</strong> ${landArea} hectares</li>
                    </ul>
                </div>
                
                <div class="dates">
                    <h3>📅 Important Dates to Remember:</h3>
                    <div class="reminder">
                        <h4>🌱 Fertilization Date: ${fertilizationDate}</h4>
                        <p>Please prepare your fertilizers and apply them on this date for optimal crop growth.</p>
                    </div>
                    
                    <div class="reminder">
                        <h4>🌾 Harvest Date: ${harvestDate}</h4>
                        <p>Your crop will be ready for harvest on this date. Plan your harvesting activities accordingly.</p>
                    </div>
                </div>
                
                <div class="highlight">
                    <h3>💡 Tips for Success:</h3>
                    <ul>
                        <li>Monitor your crop regularly for any signs of disease or pests</li>
                        <li>Ensure proper irrigation and water management</li>
                        <li>Keep track of weather conditions and adjust your farming practices accordingly</li>
                        <li>Use our Plant Care feature if you notice any issues with your crops</li>
                    </ul>
                </div>
                
                <p>We'll send you reminder emails before your fertilization and harvest dates to help you stay on track.</p>
                
                <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
                
                <p>Best regards,<br>
                <strong>The HarvestEase Team</strong></p>
            </div>
            
            <div class="footer">
                <p>This is an automated message from HarvestEase Crop Management System.</p>
                <p>© 2024 HarvestEase. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Template for fertilization reminder
const getFertilizationReminderTemplate = (farmerName, paddyType, fertilizationDate, plantedDate) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Fertilization Reminder</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .urgent { background-color: #fff3cd; border: 2px solid #ffc107; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
            .tips { background-color: #e8f4fd; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌱 HarvestEase</h1>
                <h2>Fertilization Reminder</h2>
            </div>
            
            <div class="content">
                <p>Dear <strong>${farmerName}</strong>,</p>
                
                <div class="urgent">
                    <h2>⚠️ FERTILIZATION DUE!</h2>
                    <h3>Your ${paddyType} crop needs fertilization on: <strong>${fertilizationDate}</strong></h3>
                </div>
                
                <p>This is a friendly reminder that your ${paddyType} paddy crop (planted on ${plantedDate}) is due for fertilization.</p>
                
                <div class="tips">
                    <h3>🌱 Fertilization Tips:</h3>
                    <ul>
                        <li><strong>Best Time:</strong> Early morning or late afternoon</li>
                        <li><strong>Weather:</strong> Avoid fertilizing during heavy rain or strong winds</li>
                        <li><strong>Application:</strong> Spread fertilizer evenly across the field</li>
                        <li><strong>Watering:</strong> Light watering after application helps nutrients reach roots</li>
                        <li><strong>Safety:</strong> Wear protective gear and follow manufacturer instructions</li>
                    </ul>
                </div>
                
                <p>Proper fertilization at this stage is crucial for healthy crop development and maximum yield.</p>
                
                <p>Best regards,<br>
                <strong>The HarvestEase Team</strong></p>
            </div>
            
            <div class="footer">
                <p>This is an automated reminder from HarvestEase Crop Management System.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Template for harvest reminder
const getHarvestReminderTemplate = (farmerName, paddyType, harvestDate, plantedDate) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Harvest Reminder</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .urgent { background-color: #f8d7da; border: 2px solid #dc3545; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
            .tips { background-color: #e8f4fd; padding: 15px; border-left: 4px solid #dc3545; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🌾 HarvestEase</h1>
                <h2>Harvest Reminder</h2>
            </div>
            
            <div class="content">
                <p>Dear <strong>${farmerName}</strong>,</p>
                
                <div class="urgent">
                    <h2>🌾 HARVEST TIME!</h2>
                    <h3>Your ${paddyType} crop is ready for harvest on: <strong>${harvestDate}</strong></h3>
                </div>
                
                <p>Congratulations! Your ${paddyType} paddy crop (planted on ${plantedDate}) has reached maturity and is ready for harvest.</p>
                
                <div class="tips">
                    <h3>🌾 Harvest Preparation Tips:</h3>
                    <ul>
                        <li><strong>Weather Check:</strong> Choose a dry day for harvesting</li>
                        <li><strong>Equipment:</strong> Ensure all harvesting tools are ready and sharp</li>
                        <li><strong>Storage:</strong> Prepare clean, dry storage areas for the harvested crop</li>
                        <li><strong>Labor:</strong> Arrange for sufficient help if needed</li>
                        <li><strong>Transportation:</strong> Plan how to transport the harvested crop</li>
                        <li><strong>Market:</strong> Contact buyers or prepare for market sale</li>
                    </ul>
                </div>
                
                <p>Timely harvesting ensures the best quality and maximum yield from your crop.</p>
                
                <p>Best regards,<br>
                <strong>The HarvestEase Team</strong></p>
            </div>
            
            <div class="footer">
                <p>This is an automated reminder from HarvestEase Crop Management System.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// ===== EMAIL SENDING FUNCTIONS =====

// Send crop registration confirmation email
const sendCropRegistrationEmail = async (farmerEmail, farmerName, paddyType, plantedDate, landArea, fertilizationDate, harvestDate) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: farmerEmail,
      subject: `🌾 Crop Registration Confirmed - ${paddyType} Paddy`,
      html: getCropRegistrationTemplate(farmerName, paddyType, plantedDate, landArea, fertilizationDate, harvestDate)
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Crop registration email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending crop registration email:', error);
    return { success: false, error: error.message };
  }
};

// Send fertilization reminder email
const sendFertilizationReminderEmail = async (farmerEmail, farmerName, paddyType, fertilizationDate, plantedDate) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: farmerEmail,
      subject: `🌱 Fertilization Reminder - ${paddyType} Crop Due on ${fertilizationDate}`,
      html: getFertilizationReminderTemplate(farmerName, paddyType, fertilizationDate, plantedDate)
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Fertilization reminder email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending fertilization reminder email:', error);
    return { success: false, error: error.message };
  }
};

// Send harvest reminder email
const sendHarvestReminderEmail = async (farmerEmail, farmerName, paddyType, harvestDate, plantedDate) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: farmerEmail,
      subject: `🌾 Harvest Reminder - ${paddyType} Crop Ready on ${harvestDate}`,
      html: getHarvestReminderTemplate(farmerName, paddyType, harvestDate, plantedDate)
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Harvest reminder email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending harvest reminder email:', error);
    return { success: false, error: error.message };
  }
};

// ===== EXPORT FUNCTIONS =====
module.exports = {
  sendCropRegistrationEmail,
  sendFertilizationReminderEmail,
  sendHarvestReminderEmail
};
