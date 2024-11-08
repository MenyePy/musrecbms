// BusinessCertificate.js
import React from 'react';
import { jsPDF } from 'jspdf';

const BusinessCertificate = () => {
  // Function to generate and download the certificate
  const generateCertificate = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [2000, 1414], // Adjust the format as per your PNG dimensions
    });

    // Load the PNG as a background
    const imagePath = './Blue Minimalist Certificate Of Achievement.png'; // Replace with the correct path if needed
    const imageWidth = 2000; // Set the width of the image (should match the format above)
    const imageHeight = 1414; // Set the height of the image (should match the format above)

    doc.addImage(imagePath, 'PNG', 0, 0, imageWidth, imageHeight);

    // Add custom text over the image
    doc.setFontSize(20);
    doc.text('Business Certificate', 300, 100);
    doc.setFontSize(16);
    doc.text('Issued to: [Business Owner Name]', 300, 140);
    doc.text('Valid until: [Date]', 300, 180);

    // Add the download trigger
    doc.save('Business_Certificate.pdf');
  };

  return (
    <div>
      <button onClick={generateCertificate}>
        Download Business Certificate
      </button>
    </div>
  );
};

export default BusinessCertificate;
