const express = require('express');
const connection = require('../connection');
const router = express.Router();
const emailService = require('../services/sendEmailBill');
let ejs = require('ejs');
let pdf = require('html-pdf');
let path = require('path');
var fs = require('fs');
var uuid = require('uuid');
var auth = require('../services/authentication');

router.post('/generateReport', auth.authenticationToken, (req, res) => {
    const generateduuid = uuid.v1();
    const orderDetails = req.body;
    var productDetailsReport = JSON.parse(orderDetails.productDetails);

    var query = "insert into bill (name,uuid,email,contactNumber,paymentMethod,total,productDetails,createdBy) values(?,?,?,?,?,?,?,?)";
    connection.query(query, [orderDetails.name, generateduuid, orderDetails.email, orderDetails.contactNumber, orderDetails.paymentMethod, orderDetails.totalAmount, orderDetails.productDetails, res.locals.email], (err, results) => {
        if (!err) {
            ejs.renderFile(path.join(__dirname, '', "report.ejs"), { productDetails: productDetailsReport, name: orderDetails.name, email: orderDetails.email, contactNumber: orderDetails.contactNumber, paymentMethod: orderDetails.paymentMethod, totalAmount: orderDetails.totalAmount }, (err, results) => {
                if (err) {
                    return res.status(500).json(err);
                } else {
                    pdf.create(results).toFile('./generated_pdf/' + generateduuid + ".pdf", function (err, data) {
                        if (err) {
                            console.log(err);
                            return res.status(500).json(err);
                        } else {
                            // Send email with the PDF attachment
                            const attachmentPath = './generated_pdf/' + generateduuid + '.pdf';

                            emailService.sendEmailWithAttachment(
                                orderDetails.email,
                                'Your Order Details',
                                'Please find attached your order details.',
                                `
                                <html>
                                    <head>
                                        <style>
                                            body {
                                                font-family: Arial, sans-serif;
                                            }
                                            h2 {
                                                color: #333;
                                            }
                                            table {
                                                width: 100%;
                                                border-collapse: collapse;
                                            }
                                            th, td {
                                                border: 1px solid #ddd;
                                                padding: 8px;
                                                text-align: left;
                                            }
                                            th {
                                                background-color: #f2f2f2;
                                            }
                                        </style>
                                    </head>
                                    <body>
                                        <h2>Hello ${orderDetails.name},</h2>
                                        <p>Please find attached your order report.</p>
                                        <h3>Order Details:</h3>
                                        <table>
                                            <tr>
                                                <th>Product</th>
                                                <th>Quantity</th>
                                                <th>Price</th>
                                                <th>Total</th>
                                            </tr>
                                            ${productDetailsReport.map(product => `
                                                <tr>
                                                    <td>${product.name}</td>
                                                    <td>${product.quantity}</td>
                                                    <td>${product.price}</td>
                                                    <td>${product.total}</td>
                                                </tr>
                                            `).join('')}
                                        </table>
                                        <p>Total Amount: ${orderDetails.totalAmount}</p>
                                    </body>
                                </html>
                                `,
                                attachmentPath,
                                (error, info) => {
                                    if (error) {
                                        console.error('Error sending email:', error);
                                        return res.status(500).json({ message: 'Failed to send email' });
                                    } else {
                                        console.log('Email sent:', info.response);
                                        return res.status(200).json({ message: 'Email sent successfully', uuid: generateduuid });
                                    }
                                }
                            );
                            
                        }
                    });
                }
            });
        } else {
            return res.status(500).json(err);
        }
    });
});

router.post('/getPdf', auth.authenticationToken, (req, res) => {
    const orderDetails = req.body;
    const pdfPath = './generated_pdf/' + orderDetails.uuid + '.pdf';
    if (fs.existsSync(pdfPath)) {
        res.contentType("application/pdf");
        fs.createReadStream(pdfPath).pipe(res);
    } else {
        var productDetailsReport = JSON.parse(orderDetails.productDetails);
        ejs.renderFile(path.join(__dirname, '', "report.ejs"), { productDetails: productDetailsReport, name: orderDetails.name, email: orderDetails.email, contactNumber: orderDetails.contactNumber, paymentMethod: orderDetails.paymentMethod, totalAmount: orderDetails.totalAmount }, (err, results) => {
            if (err) {
                return res.status(500).json(err);
            } else {
                pdf.create(results).toFile('./generated_pdf/' + orderDetails.uuid + ".pdf", function (err, data) {
                    if (err) {
                        console.log(err);
                        return res.status(500).json(err);
                    } else {
                        res.contentType("application/pdf");
                        fs.createReadStream(pdfPath).pipe(res);                    
                    }
                })
            }
        });
    }
});

router.get('/getBills',auth.authenticationToken,(req,res,next)=>{
    var query = "select * from bill order by id DESC";
    connection.query(query,(err,results)=>{
        if(!err){
            return res.status(200).json(results);
        }else{
            return res.status(500).json(err);
        }
    });
});

router.delete('/delete/:id',auth.authenticationToken,(req,res,next)=>{
    const id = req.params.id;
    var query = "delete from bill where id=?";
    connection.query(query,[id],(err,results)=>{
        if(!err){
            if(results.affectedRows == 0){
                return res.status(404).json({message:"Bill id does not found."});
            }
            return res.status(200).json({message:"Bill Deleted Successfully."});
        }else{
            return res.status(500).json(err);
        }
    });
});



module.exports = router;