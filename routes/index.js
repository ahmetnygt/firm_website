const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');

// Ana sayfa
router.get('/', siteController.getHomePage);

// Arama örneği (şimdilik boş)
router.get('/search', (req, res) => res.send('Arama sayfası yakında'));

router.get('/trips', siteController.getTrips);

router.post('/payment/create', siteController.createPayment);
router.get('/payment/:id', siteController.getPaymentPage);
router.post("/payment/:id", siteController.paymentComplete);

router.post("/login", siteController.login);
router.post("/register", siteController.register);
router.get("/logout", siteController.logout);

router.get('/profile', siteController.getProfilePage);
router.post('/profile/update', siteController.updateProfile);

router.get('/my-tickets', siteController.getMyTicketsPage);
router.post('/ticket/cancel', siteController.ticketAction);


module.exports = router;