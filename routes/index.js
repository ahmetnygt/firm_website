const express = require('express');
const router = express.Router();
const siteController = require('../controllers/siteController');

router.get('/robots.txt', siteController.getRobotsTxt);
router.get('/sitemap.xml', siteController.getSitemap);

router.get('/', siteController.getHomePage);
router.get('/corporate', siteController.getCorporatePage);
router.get('/branches', siteController.getBranchesPage);
router.get('/rota/:slug', siteController.getRoutePage);
router.get('/gizlilik', (req, res) => {
    req.params.slug = 'gizlilik';
    return siteController.getLegalPage(req, res);
});
router.get('/kullanim-kosullari', (req, res) => {
    req.params.slug = 'kullanim-kosullari';
    return siteController.getLegalPage(req, res);
});
router.get('/cerez-politikasi', (req, res) => {
    req.params.slug = 'cerez-politikasi';
    return siteController.getLegalPage(req, res);
});

router.get('/search', (req, res) => {
    res.redirect(301, '/');
});

router.get('/trips', siteController.getTrips);

router.get('/api/journey-seats/:id', siteController.getJourneySeats);

router.post('/payment/create', siteController.createPayment);
router.get('/payment/:id', siteController.getPaymentPage);
router.post('/payment/:id', siteController.paymentComplete);

router.post('/login', siteController.login);
router.post('/register', siteController.register);
router.get('/logout', siteController.logout);

router.get('/profile', siteController.getProfilePage);
router.post('/profile/update', siteController.updateProfile);

router.get('/my-tickets', siteController.getMyTicketsPage);
router.post('/ticket/cancel', siteController.ticketAction);

module.exports = router;
