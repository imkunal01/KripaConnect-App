const fs = require('fs');
const path = require('path');

const collection = {
  info: {
    name: "KripaConnect Complete API Test Suite",
    description: "Complete automated API test suite for KripaConnect E-Commerce Platform. Includes tests for Core Server, Authentication, Products, Categories, Subcategories, Banners, Cart, Favorites, Orders, Payments, Invoices, Analytics, Retailer B2B, Reviews, AI Recommendations, Admin Operations, and the RAG Microservice.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000", type: "string" },
    { key: "ragUrl", value: "http://localhost:8000", type: "string" },
    { key: "token", value: "", type: "string" },
    { key: "adminToken", value: "", type: "string" },
    { key: "testEmail", value: "testcustomer@example.com", type: "string" },
    { key: "testPassword", value: "Password@123", type: "string" },
    { key: "adminEmail", value: "admin@kripaconnect.in", type: "string" },
    { key: "adminPassword", value: "Admin@12345", type: "string" },
    { key: "productId", value: "", type: "string" },
    { key: "categoryId", value: "", type: "string" },
    { key: "subcategoryId", value: "", type: "string" },
    { key: "orderId", value: "", type: "string" },
    { key: "userId", value: "", type: "string" },
    { key: "bannerId", value: "", type: "string" },
    { key: "reviewId", value: "", type: "string" },
    { key: "cronSecret", value: "", type: "string" },
    { key: "adminApiKey", value: "test-admin-key", type: "string" }
  ],
  item: []
};

// Helper to create test script
function standardStatusTest(expectedStatus = 200, extraScript = "") {
  return [
    `pm.test("Status code is ${expectedStatus}", function () {`,
    `    pm.response.to.have.status(${expectedStatus});`,
    `});`,
    `pm.test("Response time is acceptable (< 2000ms)", function () {`,
    `    pm.expect(pm.response.responseTime).to.be.below(2000);`,
    `});`,
    `try {`,
    `    const res = pm.response.json();`,
    `    pm.test("Response has valid JSON body", function () {`,
    `        pm.expect(res).to.be.an("object");`,
    `    });`,
    extraScript,
    `} catch (e) {`,
    `    // Non-JSON response (e.g. PDF or XML)`,
    `}`
  ].filter(Boolean).join("\n");
}

function req(name, method, urlPath, { body = null, headers = [], authType = "none", expectedStatus = 200, extraScript = "" } = {}) {
  const headerList = [
    { key: "Accept", value: "application/json", type: "text" },
    ...headers
  ];

  if (authType === "user") {
    headerList.push({ key: "Authorization", value: "Bearer {{token}}", type: "text" });
  } else if (authType === "admin") {
    headerList.push({ key: "Authorization", value: "Bearer {{adminToken}}", type: "text" });
  }

  const requestObj = {
    method: method.toUpperCase(),
    header: headerList,
    url: {
      raw: `{{baseUrl}}${urlPath}`,
      host: ["{{baseUrl}}"],
      path: urlPath.replace(/^\//, "").split("/")
    }
  };

  if (body) {
    if (body.mode === "raw") {
      headerList.push({ key: "Content-Type", value: "application/json", type: "text" });
      requestObj.body = {
        mode: "raw",
        raw: JSON.stringify(body.data, null, 2),
        options: { raw: { language: "json" } }
      };
    } else if (body.mode === "formdata") {
      requestObj.body = {
        mode: "formdata",
        formdata: body.data
      };
    }
  }

  return {
    name,
    event: [
      {
        listen: "test",
        script: {
          exec: standardStatusTest(expectedStatus, extraScript).split("\n"),
          type: "text/javascript"
        }
      }
    ],
    request: requestObj,
    response: []
  };
}

// 1. System & Health
const systemFolder = {
  name: "1. System & Health",
  item: [
    req("Root Status Check", "GET", "/", {
      extraScript: `pm.test("Server reported healthy", function () { pm.expect(res.uptime).to.be.a("string"); });`
    }),
    req("Liveness Probe (/healthz)", "GET", "/healthz", {
      extraScript: `pm.test("OK is true", function () { pm.expect(res.ok).to.eql(true); });`
    }),
    req("Cron Liveness Ping", "GET", "/api/cron/ping", {
      extraScript: `pm.test("Cron message received", function () { pm.expect(res.ok).to.eql(true); });`
    }),
    req("SEO XML Sitemap", "GET", "/api/sitemap.xml", {
      expectedStatus: 200,
      headers: [{ key: "Accept", value: "application/xml", type: "text" }]
    })
  ]
};

// 2. Authentication
const authFolder = {
  name: "2. Authentication & User Management",
  item: [
    req("Register Customer", "POST", "/api/auth/register", {
      expectedStatus: 201,
      body: {
        mode: "raw",
        data: {
          name: "Test Customer",
          email: "testcustomer" + Date.now() + "@example.com",
          password: "Password@123",
          role: "customer"
        }
      },
      extraScript: `if (res.token) { pm.collectionVariables.set("token", res.token); }`
    }),
    req("Login Customer", "POST", "/api/auth/login", {
      expectedStatus: 200,
      body: {
        mode: "raw",
        data: {
          email: "{{testEmail}}",
          password: "{{testPassword}}"
        }
      },
      extraScript: `if (res.token) { pm.collectionVariables.set("token", res.token); pm.collectionVariables.set("userId", res._id); }`
    }),
    req("Login Admin", "POST", "/api/auth/login", {
      expectedStatus: 200,
      body: {
        mode: "raw",
        data: {
          email: "{{adminEmail}}",
          password: "{{adminPassword}}"
        }
      },
      extraScript: `if (res.token) { pm.collectionVariables.set("adminToken", res.token); }`
    }),
    req("Get Current User Profile", "GET", "/api/auth/profile", {
      authType: "user",
      extraScript: `pm.test("User has email", function () { pm.expect(res.email).to.be.a("string"); });`
    }),
    req("Update User Profile & Address", "PUT", "/api/auth/profile", {
      authType: "user",
      body: {
        mode: "raw",
        data: {
          name: "Updated Customer Name",
          phone: "9876543210",
          savedAddress: {
            name: "John Doe",
            phone: "9876543210",
            addressLine: "Flat 402, Lotus Residency",
            city: "Indore",
            state: "Madhya Pradesh",
            pincode: "452001",
            default: true
          }
        }
      }
    }),
    req("Request Retailer Upgrade", "POST", "/api/auth/retailer-request", {
      authType: "user",
      body: {
        mode: "raw",
        data: {
          shopName: "Kripa Wholesale Mart",
          ownerName: "Test Retailer",
          phone: "9876500000",
          shopAddress: "123 Commercial Market, Indore",
          businessProof: "GSTIN23AAAAA0000A1Z5"
        }
      }
    }),
    req("Request Login OTP", "POST", "/api/auth/login-otp/request", {
      body: {
        mode: "raw",
        data: { email: "{{testEmail}}" }
      }
    }),
    req("Verify Login OTP", "POST", "/api/auth/login-otp/verify", {
      body: {
        mode: "raw",
        data: { email: "{{testEmail}}", otp: "123456" }
      }
    }),
    req("Request Password Reset Email", "POST", "/api/auth/forgot-password", {
      body: {
        mode: "raw",
        data: { email: "{{testEmail}}" }
      }
    }),
    req("Reset Password With Token", "POST", "/api/auth/reset-password", {
      body: {
        mode: "raw",
        data: { token: "sample_reset_token_hex_string", newPassword: "NewPassword@123" }
      }
    }),
    req("Refresh Access Token", "POST", "/api/auth/refresh", {
      extraScript: `if (res.token) { pm.collectionVariables.set("token", res.token); }`
    }),
    req("Logout User", "POST", "/api/auth/logout")
  ]
};

// 3. Products
const productFolder = {
  name: "3. Products Catalog",
  item: [
    req("List Products (Public)", "GET", "/api/products?page=1&limit=12", {
      extraScript: `if (res.items && res.items.length > 0) { pm.collectionVariables.set("productId", res.items[0]._id); }`
    }),
    req("Filter Products (Category & Price)", "GET", "/api/products?minPrice=100&maxPrice=5000&availability=in", {
      extraScript: `pm.test("Items array returned", function () { pm.expect(res.items).to.be.an("array"); });`
    }),
    req("Get Single Product Details", "GET", "/api/products/{{productId}}", {
      extraScript: `pm.test("Product ID matches", function () { pm.expect(res._id).to.eql(pm.collectionVariables.get("productId")); });`
    }),
    req("Create Product (Admin)", "POST", "/api/products", {
      authType: "admin",
      expectedStatus: 201,
      body: {
        mode: "formdata",
        data: [
          { key: "name", value: "Smart Automation Switch Pro " + Date.now(), type: "text" },
          { key: "description", value: "High durability Wi-Fi enabled smart modular switch with surge protection.", type: "text" },
          { key: "price", value: "899", type: "text" },
          { key: "retailer_price", value: "650", type: "text" },
          { key: "price_bulk", value: "599", type: "text" },
          { key: "min_bulk_qty", value: "10", type: "text" },
          { key: "stock", value: "100", type: "text" },
          { key: "tags", value: "smart,electronics,iot,home", type: "text" }
        ]
      },
      extraScript: `if (res._id) { pm.collectionVariables.set("productId", res._id); }`
    }),
    req("Update Product (Admin)", "PUT", "/api/products/{{productId}}", {
      authType: "admin",
      body: {
        mode: "formdata",
        data: [
          { key: "price", value: "849", type: "text" },
          { key: "stock", value: "120", type: "text" }
        ]
      }
    }),
    req("Delete Product (Admin)", "DELETE", "/api/products/{{productId}}", {
      authType: "admin"
    })
  ]
};

// 4. Categories & Subcategories
const categoryFolder = {
  name: "4. Categories & Subcategories",
  item: [
    req("List All Categories (Public)", "GET", "/api/categories", {
      extraScript: `if (Array.isArray(res) && res.length > 0) { pm.collectionVariables.set("categoryId", res[0]._id); }`
    }),
    req("Create Category (Admin)", "POST", "/api/categories", {
      authType: "admin",
      expectedStatus: 201,
      body: {
        mode: "raw",
        data: {
          name: "Smart Lighting " + Date.now(),
          description: "Connected LED fixtures, strips, and drivers"
        }
      },
      extraScript: `if (res._id) { pm.collectionVariables.set("categoryId", res._id); }`
    }),
    req("Delete Category (Admin)", "DELETE", "/api/categories/{{categoryId}}", {
      authType: "admin"
    }),
    req("List Subcategories (Public)", "GET", "/api/subcategories?category_id={{categoryId}}", {
      extraScript: `if (Array.isArray(res) && res.length > 0) { pm.collectionVariables.set("subcategoryId", res[0]._id); }`
    })
  ]
};

// 5. Banners
const bannerFolder = {
  name: "5. Banners",
  item: [
    req("List Public Live Banners", "GET", "/api/banners", {
      extraScript: `pm.test("Banners is array", function () { pm.expect(res).to.be.an("array"); });`
    })
  ]
};

// 6. Cart & Wishlist
const cartWishlistFolder = {
  name: "6. Cart & Wishlist",
  item: [
    req("Get User Cart", "GET", "/api/cart?purchaseMode=customer", {
      authType: "user",
      extraScript: `pm.test("Success is true", function () { pm.expect(res.success).to.eql(true); });`
    }),
    req("Add Item To Cart", "POST", "/api/cart/add", {
      authType: "user",
      body: {
        mode: "raw",
        data: {
          productId: "{{productId}}",
          qty: 2,
          purchaseMode: "customer"
        }
      }
    }),
    req("Update Cart Item Quantity", "PUT", "/api/cart/item/{{productId}}", {
      authType: "user",
      body: {
        mode: "raw",
        data: {
          qty: 3,
          purchaseMode: "customer"
        }
      }
    }),
    req("Remove Item From Cart", "DELETE", "/api/cart/item/{{productId}}", {
      authType: "user"
    }),
    req("Merge Guest Cart", "POST", "/api/cart/merge", {
      authType: "user",
      body: {
        mode: "raw",
        data: {
          items: [
            { productId: "{{productId}}", qty: 1 }
          ],
          purchaseMode: "customer"
        }
      }
    }),
    req("Get Favorites", "GET", "/api/favorites", {
      authType: "user"
    }),
    req("Add Product To Favorites", "POST", "/api/favorites/add", {
      authType: "user",
      body: {
        mode: "raw",
        data: { productId: "{{productId}}" }
      }
    }),
    req("Remove Product From Favorites", "DELETE", "/api/favorites/remove/{{productId}}", {
      authType: "user"
    })
  ]
};

// 7. Orders & Invoices
const orderFolder = {
  name: "7. Orders & Invoices",
  item: [
    req("Create Order (Customer Checkout)", "POST", "/api/orders", {
      authType: "user",
      expectedStatus: 201,
      body: {
        mode: "raw",
        data: {
          items: [
            { product: "{{productId}}", qty: 1 }
          ],
          paymentMethod: "COD",
          purchaseMode: "customer",
          shippingAddress: {
            fullName: "Kunal Sharma",
            addressLine1: "123 Main Street",
            city: "Indore",
            state: "Madhya Pradesh",
            pincode: "452001",
            phone: "9876543210"
          }
        }
      },
      extraScript: `if (res._id) { pm.collectionVariables.set("orderId", res._id); }`
    }),
    req("Get My Orders", "GET", "/api/orders/my", {
      authType: "user",
      extraScript: `pm.test("Orders array returned", function () { pm.expect(res).to.be.an("array"); });`
    }),
    req("Get Order By ID", "GET", "/api/orders/{{orderId}}", {
      authType: "user",
      extraScript: `pm.test("Order ID matches", function () { pm.expect(res._id).to.eql(pm.collectionVariables.get("orderId")); });`
    }),
    req("Download Order GST Invoice (PDF)", "GET", "/api/orders/{{orderId}}/invoice", {
      authType: "user",
      expectedStatus: 200,
      headers: [{ key: "Accept", value: "application/pdf", type: "text" }]
    }),
    req("Cancel Order (Customer)", "PUT", "/api/orders/{{orderId}}/cancel", {
      authType: "user"
    }),
    req("Admin - Get All Orders", "GET", "/api/orders", {
      authType: "admin"
    }),
    req("Admin - Update Delivery Status", "PUT", "/api/orders/{{orderId}}/status", {
      authType: "admin",
      body: {
        mode: "raw",
        data: { status: "processing" }
      }
    }),
    req("Admin - Trigger & Email Invoice", "POST", "/api/invoices/{{orderId}}", {
      authType: "admin"
    }),
    req("Admin - Delete Order", "DELETE", "/api/orders/{{orderId}}", {
      authType: "admin"
    })
  ]
};

// 8. Payments (Razorpay)
const paymentFolder = {
  name: "8. Payments (Razorpay)",
  item: [
    req("Create Razorpay Order", "POST", "/api/payments/create-order", {
      authType: "user",
      body: {
        mode: "raw",
        data: { orderId: "{{orderId}}" }
      }
    }),
    req("Verify Razorpay Payment Signature", "POST", "/api/payments/verify", {
      authType: "user",
      body: {
        mode: "raw",
        data: {
          razorpay_order_id: "order_sample123",
          razorpay_payment_id: "pay_sample456",
          razorpay_signature: "mock_signature_hash"
        }
      }
    }),
    req("Razorpay Webhook Listener", "POST", "/api/payments/webhook", {
      body: {
        mode: "raw",
        data: {
          event: "payment.captured",
          payload: {
            payment: {
              entity: {
                id: "pay_test12345",
                order_id: "order_sample123",
                amount: 89900
              }
            }
          }
        }
      }
    })
  ]
};

// 9. Analytics (Admin)
const analyticsFolder = {
  name: "9. Analytics (Admin)",
  item: [
    req("Dashboard Overview KPIs", "GET", "/api/analytics/overview", { authType: "admin" }),
    req("Revenue By Day Stats", "GET", "/api/analytics/revenue", { authType: "admin" }),
    req("Orders Distribution Stats", "GET", "/api/analytics/orders", { authType: "admin" }),
    req("Top Selling Products", "GET", "/api/analytics/top-products", { authType: "admin" }),
    req("User Growth Stats", "GET", "/api/analytics/user-growth", { authType: "admin" }),
    req("Low Stock Alert Products", "GET", "/api/analytics/low-stock", { authType: "admin" })
  ]
};

// 10. Retailer B2B Portal
const retailerFolder = {
  name: "10. Retailer B2B Wholesale Portal",
  item: [
    req("Retailer Wholesale Catalog", "GET", "/api/retailer/products", { authType: "user" }),
    req("Create Retailer Bulk Order", "POST", "/api/retailer/orders", {
      authType: "user",
      body: {
        mode: "raw",
        data: {
          items: [
            { product: "{{productId}}", qty: 15 }
          ],
          shippingAddress: {
            shopName: "Kripa Wholesale",
            addressLine: "45 Industrial Area, Sanwer Road",
            city: "Indore",
            state: "Madhya Pradesh",
            pincode: "452015",
            phone: "9876500000"
          }
        }
      }
    }),
    req("Get Retailer Order History", "GET", "/api/retailer/orders", { authType: "user" })
  ]
};

// 11. Reviews
const reviewFolder = {
  name: "11. Product Reviews",
  item: [
    req("List Reviews for Product (Public)", "GET", "/api/reviews/product/{{productId}}", {
      extraScript: `if (res.data && res.data.length > 0) { pm.collectionVariables.set("reviewId", res.data[0]._id); }`
    }),
    req("Create Review for Product", "POST", "/api/reviews/product/{{productId}}", {
      authType: "user",
      expectedStatus: 201,
      body: {
        mode: "raw",
        data: {
          rating: 5,
          text: "Outstanding quality! Fast dispatch and genuine components."
        }
      },
      extraScript: `if (res.data && res.data._id) { pm.collectionVariables.set("reviewId", res.data._id); }`
    }),
    req("List All Reviews (Admin)", "GET", "/api/reviews/all", { authType: "admin" }),
    req("Delete Review (Admin)", "DELETE", "/api/reviews/{{reviewId}}", { authType: "admin" })
  ]
};

// 12. Smart AI Recommendations
const recommendFolder = {
  name: "12. AI Semantic Recommendations",
  item: [
    req("POST /api/recommend (Semantic Natural Query)", "POST", "/api/recommend", {
      body: {
        mode: "raw",
        data: {
          query: "smart switches with surge protection under 1000",
          limit: 6
        }
      },
      extraScript: `pm.test("Recommendations returned", function () { pm.expect(res.products).to.be.an("array"); });`
    }),
    req("GET /api/recommend/similar/:productId", "GET", "/api/recommend/similar/{{productId}}?limit=4", {
      extraScript: `pm.test("Similar products array returned", function () { pm.expect(res.products).to.be.an("array"); });`
    })
  ]
};

// 13. Admin Management Portal
const adminMgmtFolder = {
  name: "13. Admin Management Portal",
  item: [
    req("List Platform Users", "GET", "/api/admin/users", {
      authType: "admin",
      extraScript: `if (res.data && res.data.length > 0) { pm.collectionVariables.set("userId", res.data[0]._id); }`
    }),
    req("Toggle Block/Unblock User", "PUT", "/api/admin/users/block/{{userId}}", { authType: "admin" }),
    req("Update User Role (Customer/Retailer/Admin)", "PUT", "/api/admin/users/role/{{userId}}", {
      authType: "admin",
      body: {
        mode: "raw",
        data: { role: "retailer" }
      }
    }),
    req("Clear Retailer Cooldown", "PUT", "/api/admin/users/role/{{userId}}/clear-cooldown", { authType: "admin" }),
    req("Get High-level Stats", "GET", "/api/admin/stats", { authType: "admin" }),
    req("Download CSV Import Template", "GET", "/api/admin/products/csv-template", {
      authType: "admin",
      expectedStatus: 200,
      headers: [{ key: "Accept", value: "text/csv", type: "text" }]
    }),
    req("Bulk Export Products CSV", "POST", "/api/admin/products/bulk-export", {
      authType: "admin",
      headers: [{ key: "Accept", value: "text/csv", type: "text" }],
      body: {
        mode: "raw",
        data: { productIds: ["{{productId}}"] }
      }
    }),
    req("Bulk Product Action (Set Stock / Price / Status)", "POST", "/api/admin/products/bulk-action", {
      authType: "admin",
      body: {
        mode: "raw",
        data: {
          productIds: ["{{productId}}"],
          action: "setStock",
          payload: { stock: 50 }
        }
      }
    }),
    req("Admin - Get Retailer Orders", "GET", "/api/admin/retailer-orders", { authType: "admin" }),
    req("Admin - List All Categories", "GET", "/api/admin/categories", { authType: "admin" }),
    req("Admin - Toggle Category Status", "PATCH", "/api/admin/categories/{{categoryId}}/status", {
      authType: "admin",
      body: {
        mode: "raw",
        data: { status: "active" }
      }
    }),
    req("Admin - List All Subcategories", "GET", "/api/admin/subcategories", { authType: "admin" }),
    req("Admin - List All Banners", "GET", "/api/admin/banners", { authType: "admin" })
  ]
};

// 14. RAG Microservice Direct (:8000)
function ragReq(name, method, urlPath, { body = null, headers = [], expectedStatus = 200, extraScript = "" } = {}) {
  const headerList = [
    { key: "Accept", value: "application/json", type: "text" },
    ...headers
  ];

  const requestObj = {
    method: method.toUpperCase(),
    header: headerList,
    url: {
      raw: `{{ragUrl}}${urlPath}`,
      host: ["{{ragUrl}}"],
      path: urlPath.replace(/^\//, "").split("/")
    }
  };

  if (body) {
    headerList.push({ key: "Content-Type", value: "application/json", type: "text" });
    requestObj.body = {
      mode: "raw",
      raw: JSON.stringify(body.data, null, 2),
      options: { raw: { language: "json" } }
    };
  }

  return {
    name,
    event: [
      {
        listen: "test",
        script: {
          exec: standardStatusTest(expectedStatus, extraScript).split("\n"),
          type: "text/javascript"
        }
      }
    ],
    request: requestObj,
    response: []
  };
}

const ragMicroserviceFolder = {
  name: "14. RAG Microservice Direct (:8000)",
  item: [
    ragReq("RAG Microservice Root", "GET", "/", {
      extraScript: `pm.test("Status is ok", function () { pm.expect(res.status).to.eql("ok"); });`
    }),
    ragReq("RAG Health Check", "GET", "/health", {
      extraScript: `pm.test("Health is healthy", function () { pm.expect(res.status).to.eql("healthy"); });`
    }),
    ragReq("RAG Deep Dependencies Health", "GET", "/health/deps", {
      extraScript: `pm.test("Dependencies checked", function () { pm.expect(res.dependencies).to.be.an("object"); });`
    }),
    ragReq("RAG API Router Ping", "GET", "/api/ping", {
      extraScript: `pm.test("Ping pong", function () { pm.expect(res.ping).to.eql("pong"); });`
    }),
    ragReq("RAG Direct Recommendation", "POST", "/api/recommend", {
      body: {
        mode: "raw",
        data: {
          query: "cotton shirt under 1500",
          limit: 5
        }
      },
      extraScript: `pm.test("Total products returned", function () { pm.expect(res.products).to.be.an("array"); });`
    }),
    ragReq("RAG List Products Catalogue", "GET", "/api/products?limit=20"),
    ragReq("RAG Index Status (Admin)", "GET", "/api/admin/index-status", {
      headers: [{ key: "X-Admin-Api-Key", value: "{{adminApiKey}}", type: "text" }]
    }),
    ragReq("RAG Incremental Sync (Admin)", "POST", "/api/admin/sync", {
      headers: [{ key: "X-Admin-Api-Key", value: "{{adminApiKey}}", type: "text" }]
    })
  ]
};

collection.item = [
  systemFolder,
  authFolder,
  productFolder,
  categoryFolder,
  bannerFolder,
  cartWishlistFolder,
  orderFolder,
  paymentFolder,
  analyticsFolder,
  retailerFolder,
  reviewFolder,
  recommendFolder,
  adminMgmtFolder,
  ragMicroserviceFolder
];

const outputPath = path.resolve(__dirname, "../../KripaConnect_API_Postman_Collection.json");
fs.writeFileSync(outputPath, JSON.stringify(collection, null, 2), "utf8");
console.log("Successfully generated Postman collection at:", outputPath);
