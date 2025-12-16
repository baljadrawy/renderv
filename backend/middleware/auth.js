module.exports = function authMiddleware(req, res, next) {
  const token = req.headers['authorization'] || req.query.token;
  
  // للاستخدام الشخصي: تحقق بسيط من token
  const expectedToken = process.env.AUTH_TOKEN;
  
  if (!expectedToken) {
    // إذا لم يكن هناك token في .env، السماح بالوصول
    return next();
  }
  
  // التحقق من Token
  const receivedToken = token?.replace('Bearer ', '');
  
  if (receivedToken !== expectedToken) {
    return res.status(401).json({ 
      success: false, 
      error: 'غير مصرح - token غير صحيح' 
    });
  }
  
  next();
};
