const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

const PRIMARY_COLOR = '#055923';
const SECON_COLOR = '#555555';
const BORDER_COLOR = '#CBD5E1';
const BG_COLOR = '#F8FAFC';

const generatePDF = (data, signatureBuffer) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ compress: false, margin: 40, size: 'A4', bufferPages: true });
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', reject);

        // --- HEADER ---
        const logoPath = path.join(__dirname, 'asset/images/4d-logo.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, 40, 35, { width: 70 });
        }

        doc.font('Helvetica-Bold').fontSize(22).fillColor(PRIMARY_COLOR).text('ST. BERNADINE', 120, 42);
        doc.fontSize(12).fillColor(SECON_COLOR).text('SCHOOL OF ALLIED HEALTH', 120, 68);

        doc.font('Helvetica').fontSize(9).fillColor('#888888').text('591 Summit Ave Suite 410, Jersey City, NJ 07306', 0, 45, { align: 'right', width: 555 });
        doc.text('Phone: +1 (201) 222-1116', 0, 58, { align: 'right', width: 555 });
        doc.text('school@stbernadineschoolofallied.com', 0, 71, { align: 'right', width: 555 });
        doc.text('www.stbernadineschoolofallied.com', 0, 84, { align: 'right', width: 555 });

        doc.moveDown(4);

        // --- TITLE BANNER ---
        doc.rect(40, 120, 515, 35).fill(PRIMARY_COLOR);
        doc.fillColor('white').font('Helvetica-Bold').fontSize(14).text('OFFICIAL STUDENT ENROLLMENT APPLICATION', 40, 131, { align: 'center', width: 515 });

        // Render application date top right of banner
        doc.fillColor('white').fontSize(9).text(`DATE MODIFIED: ${new Date().toLocaleDateString()}`, 40, 122, { align: 'right', width: 505 });

        let y = 180;

        // --- HELPER FUNCTIONS ---
        const checkPageBreak = (neededHeight) => {
            if (y + neededHeight > 750) {
                doc.addPage();
                y = 50;
            }
        };

        const drawSectionHeader = (title) => {
            checkPageBreak(40);
            doc.rect(40, y, 515, 25).fill(BG_COLOR);
            doc.rect(40, y, 4, 25).fill(PRIMARY_COLOR); // Left accent border
            doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(12).text(title.toUpperCase(), 55, y + 7);
            y += 35;
        };

        const drawRow = (leftLabel, leftValue, rightLabel, rightValue) => {
            checkPageBreak(30);

            // Left Column
            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(9).text(leftLabel, 40, y);
            doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11).text(leftValue || 'N/A', 40, y + 12);

            // Right Column (if exists)
            if (rightLabel !== undefined) {
                doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(9).text(rightLabel, 310, y);
                doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11).text(rightValue || 'N/A', 310, y + 12);
            }

            // Bottom Border line for row
            doc.lineWidth(0.5).strokeColor(BORDER_COLOR).moveTo(40, y + 28).lineTo(555, y + 28).stroke();
            y += 40;
        };

        const drawFullRow = (label, value) => {
            checkPageBreak(30);
            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(9).text(label, 40, y);
            doc.fillColor('#111111').font('Helvetica-Bold').fontSize(11).text(value || 'N/A', 40, y + 12, { width: 515 });

            // Calculate height taken by value text
            const textHeight = doc.heightOfString(value || 'N/A', { width: 515, font: 'Helvetica-Bold', fontSize: 11 });
            const rowHeight = Math.max(28, textHeight + 16);

            doc.lineWidth(0.5).strokeColor(BORDER_COLOR).moveTo(40, y + rowHeight).lineTo(555, y + rowHeight).stroke();
            y += rowHeight + 10;
        };

        // --- CONTENT ---

        if (data['Program']) {
            doc.rect(40, y, 515, 40).fill('#F0FDF4');
            doc.rect(40, y, 515, 40).lineWidth(1).strokeColor('#22C55E').stroke();
            doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(11).text('PROGRAM APPLIED FOR:', 55, y + 14);
            doc.fillColor('#166534').font('Helvetica-Bold').fontSize(14).text(data['Program'], 210, y + 12);
            y += 60;
        }

        drawSectionHeader('Personal Information');
        drawRow('First Name', data.firstName, 'Last Name', data.lastName);
        drawRow('Middle Name', data.middleName, 'Date of Application', data.dateOfApplication);

        drawSectionHeader('Contact Details');
        drawFullRow('Street Address', data.address);
        drawRow('City / Municipality', data.city, 'State / Province', data.state);
        drawRow('Country', data.country, 'Postal/Zip Code', data.postalCode);
        drawRow('Primary Phone', data.phone, 'Email Address', data.email);

        drawSectionHeader('Family & Emergency Contact');
        drawRow("Mother's Maiden Name", data.motherName, "Father's Name", data.fatherName);
        drawRow('Emergency Contact Person', data.emergencyContactName, 'Emergency Contact Phone', data.emergencyContactPhone);

        drawSectionHeader('Educational & Professional Background');
        drawRow('Highest Education Level / Profession', data.profession === 'Other' ? data.otherProfession : data.profession, 'School Attended', data.school);
        drawRow('Course / Major', data.course, 'Year Graduated', data.yearGraduated);

        if (data.company1 || data.company2) {
            drawSectionHeader('Employment History');
            if (data.company1) drawRow('Company 1', data.company1, 'Dates Employed', data.dateEmployed1);
            if (data.company2) drawRow('Company 2', data.company2, 'Dates Employed', data.dateEmployed2);
        }

        drawFullRow('Referred By', data.referrer);

        // --- SIGNATURE & DECLARATION ---
        checkPageBreak(150);
        y += 20;

        doc.rect(40, y, 515, 120).fill('#F8FAFC');
        doc.rect(40, y, 515, 120).lineWidth(1).strokeColor(BORDER_COLOR).stroke();

        doc.fillColor(PRIMARY_COLOR).font('Helvetica-Bold').fontSize(10).text('APPLICANT DECLARATION', 55, y + 15);
        doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(9).text(
            'I hereby certify that all information provided in this application is true and correct to the best of my knowledge and belief. I understand that any false statements or omissions may disqualify me from enrollment or result in dismissal from St. Bernadine School of Allied Health.',
            55, y + 35, { width: 485, align: 'justify' }
        );

        if (signatureBuffer) {
            doc.image(signatureBuffer, 55, y + 85, { height: 40 });
            doc.lineWidth(1).strokeColor('#000000').moveTo(55, y + 105).lineTo(250, y + 105).stroke();
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10).text(`${data.firstName} ${data.lastName}`, 55, y + 112);
            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(8).text('Applicant Signature', 55, y + 124);
        } else {
            doc.lineWidth(1).strokeColor('#000000').moveTo(55, y + 105).lineTo(250, y + 105).stroke();
            doc.fillColor('#000000').font('Helvetica-Bold').fontSize(12).text(`${data.firstName} ${data.lastName}`, 55, y + 112);
            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(8).text('Applicant E-Signature', 55, y + 124);
        }

        doc.lineWidth(1).strokeColor('#000000').moveTo(350, y + 105).lineTo(500, y + 105).stroke();
        doc.fillColor('#000000').font('Helvetica').fontSize(12).text(`${new Date().toLocaleDateString()}`, 350, y + 90);
        doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(8).text('Date Signed', 350, y + 112);

        // --- AUTOMATIC FOOTER ---
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);
            // Disable bottom margin temporarily so footer does not cause a page break
            let oldBottomMargin = doc.page.margins.bottom;
            doc.page.margins.bottom = 0;

            doc.lineWidth(1).strokeColor(PRIMARY_COLOR).moveTo(40, 800).lineTo(555, 800).stroke();
            doc.fillColor(SECON_COLOR).font('Helvetica').fontSize(8)
                .text(`Application Reference: STB-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, 40, 810, { lineBreak: false });
            doc.text(`Page ${i + 1} of ${pages.count}`, 0, 810, { align: 'right', width: 555, lineBreak: false });

            doc.page.margins.bottom = oldBottomMargin;
        }

        doc.end();
    });
};

const run = async () => {
    try {
        const dummyData = {
            Program: "Certified Nurse Assistant (CNA)",
            firstName: "John",
            lastName: "Doe",
            address: "123 Main St",
            city: "Jersey City",
            state: "NJ",
            postalCode: "07306",
            country: "USA",
            phone: "1234567890",
            email: "john@example.com",
            motherName: "Jane Doe",
            fatherName: "Jim Doe",
            emergencyContactName: "Jill Doe",
            emergencyContactPhone: "0987654321",
            referrer: "Google",
            profession: "Student",
            school: "High School",
            course: "General",
            yearGraduated: "2020",
            company1: "McDonalds",
            dateEmployed1: "2021-2022",
            company2: "Starbucks",
            dateEmployed2: "2022-2023",
            dateOfApplication: "2023-10-27"
        };
        const buffer = await generatePDF(dummyData, null);
        fs.writeFileSync('test_app.pdf', buffer);
        console.log("SUCCESS");
    } catch (err) {
        console.log("FAIL", err);
    }
}
run();
