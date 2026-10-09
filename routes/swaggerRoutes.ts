import { Router } from "express";

const router = Router();

const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Nihol AI ERP API Documentation",
    version: "1.0.0",
    description: "Bog'cha boshqaruv tizimi barcha panellari uchun REST API hujjatlari va sinov muhiti (Swagger UI)."
  },
  servers: [
    { url: "/api", description: "Asosiy API server" }
  ],
  paths: {
    "/login": {
      post: {
        summary: "Tizimga kirish (Login)",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  username: { type: "string" },
                  password: { type: "string" },
                  role: { type: "string" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Muvaffaqiyatli login" } }
      }
    },
    "/kindergartens": {
      get: {
        summary: "Barcha bog'chalar ro'yxati",
        tags: ["Kindergartens / SuperAdmin"],
        responses: { 200: { description: "Bog'chalar ro'yxati" } }
      },
      post: {
        summary: "Yangi bog'cha qo'shish",
        tags: ["Kindergartens / SuperAdmin"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  address: { type: "string" },
                  phone: { type: "string" },
                  capacity: { type: "number" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Yaratilgan bog'cha" } }
      }
    },
    "/kindergartens/{id}": {
      put: {
        summary: "Bog'cha ma'lumotlarini tahrirlash",
        tags: ["Kindergartens / SuperAdmin"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Yangilangan bog'cha" } }
      },
      delete: {
        summary: "Bog'chani o'chirish",
        tags: ["Kindergartens / SuperAdmin"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Muvaffaqiyatli o'chirildi" } }
      }
    },
    "/kindergartens/{id}/director": {
      post: {
        summary: "Bog'chaga Direktor biriktirish",
        tags: ["Kindergartens / SuperAdmin"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Direktor yaratildi" } }
      }
    },
    "/employees": {
      get: {
        summary: "Xodimlar ro'yxati",
        tags: ["Employees"],
        responses: { 200: { description: "Xodimlar ro'yxati" } }
      },
      post: {
        summary: "Yangi xodim yaratish",
        tags: ["Employees"],
        responses: { 200: { description: "Yaratilgan xodim" } }
      }
    },
    "/employees/{id}": {
      put: {
        summary: "Xodimni tahrirlash",
        tags: ["Employees"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Yangilangan xodim" } }
      },
      delete: {
        summary: "Xodimni o'chirish",
        tags: ["Employees"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "O'chirildi" } }
      }
    },
    "/children": {
      get: {
        summary: "Bolalar ro'yxati",
        tags: ["Children"],
        responses: { 200: { description: "Bolalar ro'yxati" } }
      },
      post: {
        summary: "Yangi bola qabul qilish",
        tags: ["Children"],
        responses: { 200: { description: "Yaratilgan bola" } }
      }
    },
    "/children/{id}": {
      put: {
        summary: "Bola ma'lumotlarini tahrirlash",
        tags: ["Children"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Yangilangan bola" } }
      },
      delete: {
        summary: "Bolani o'chirish",
        tags: ["Children"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "O'chirildi" } }
      }
    },
    "/groups": {
      get: {
        summary: "Guruhlar ro'yxati",
        tags: ["Groups"],
        responses: { 200: { description: "Guruhlar" } }
      },
      post: {
        summary: "Yangi guruh ochish",
        tags: ["Groups"],
        responses: { 200: { description: "Yaratilgan guruh" } }
      }
    },
    "/groups/{id}": {
      put: {
        summary: "Guruhni tahrirlash",
        tags: ["Groups"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Yangilangan guruh" } }
      },
      delete: {
        summary: "Guruhni o'chirish",
        tags: ["Groups"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "O'chirildi" } }
      }
    },
    "/payments": {
      get: {
        summary: "To'lovlar ro'yxati",
        tags: ["Payments & Finance"],
        responses: { 200: { description: "To'lovlar" } }
      },
      post: {
        summary: "To'lov qabul qilish",
        tags: ["Payments & Finance"],
        responses: { 200: { description: "Yangi to'lov" } }
      }
    },
    "/payments/{id}": {
      put: {
        summary: "To'lovni tahrirlash",
        tags: ["Payments & Finance"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "Yangilangan to'lov" } }
      },
      delete: {
        summary: "To'lovni bekorgan qilish / o'chirish",
        tags: ["Payments & Finance"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "O'chirildi" } }
      }
    },
    "/attendance": {
      get: {
        summary: "Kunlik davomat jurnali",
        tags: ["Attendance & FaceID"],
        responses: { 200: { description: "Davomat" } }
      },
      post: {
        summary: "Davomat belgilash",
        tags: ["Attendance & FaceID"],
        responses: { 200: { description: "Saqlandi" } }
      }
    },
    "/face-id/scan": {
      post: {
        summary: "FaceID AI yuz aniqlash va davomat qilish",
        tags: ["Attendance & FaceID"],
        responses: { 200: { description: "Yuz mos keldi / mos kelmadi" } }
      }
    },
    "/chef/dashboard": {
      get: {
        summary: "Oshpaz paneli statistikasi va menyu",
        tags: ["Chef & Kitchen"],
        responses: { 200: { description: "Oshpaz ma'lumotlari" } }
      }
    },
    "/hardware/status": {
      get: {
        summary: "IoT va FaceID kameralar holati",
        tags: ["Safety & Hardware"],
        responses: { 200: { description: "Qurilmalar holati" } }
      }
    }
  }
};

router.get("/swagger.json", (req, res) => {
  res.json(openApiSpec);
});

router.get("/docs", (req, res) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!DOCTYPE html>
    <html lang="uz">
    <head>
      <meta charset="UTF-8">
      <title>Nihol AI ERP - API Swagger Documentation</title>
      <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
      <style>
        body { margin: 0; padding: 0; background: #0f172a; }
        .swagger-ui .topbar { display: none; }
        .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
      </style>
    </head>
    <body>
      <div id="swagger-ui"></div>
      <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
      <script>
        window.onload = () => {
          window.ui = SwaggerUIBundle({
            url: '/api/swagger.json',
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.SwaggerUIStandalonePreset
            ]
          });
        };
      </script>
    </body>
    </html>
  `);
});

export default router;
