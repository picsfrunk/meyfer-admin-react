// productService.js

// Simulated database
const products = [];

// Create a new product
const createProduct = (product) => {
    product.id = products.length + 1; // Simple ID assignment
    products.push(product);
    return product;
};

// Read all products
const getProducts = () => {
    return products;
};

// Read a product by ID
const getProductById = (id) => {
    return products.find(product => product.id === id);
};

// Update a product
const updateProduct = (id, updatedProduct) => {
    const index = products.findIndex(product => product.id === id);
    if (index !== -1) {
        products[index] = { id, ...updatedProduct };
        return products[index];
    }
    return null;
};

// Delete a product
const deleteProduct = (id) => {
    const index = products.findIndex(product => product.id === id);
    if (index !== -1) {
        const deletedProduct = products.splice(index, 1);
        return deletedProduct[0];
    }
    return null;
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };