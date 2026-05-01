const adminRoutes = require('../src/routes/adminRoutes');

console.log('--- Registered Admin Routes ---');
adminRoutes.stack.forEach(layer => {
  if (layer.route) {
    console.log(`${layer.route.stack[0].method.toUpperCase()} ${layer.route.path}`);
  } else if (layer.name === 'router') {
    // This happens for things like protectAdmin if it was a nested router, 
    // but here it's likely a middleware
    console.log(`Middleware/Router: ${layer.name}`);
  }
});
