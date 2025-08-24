-- Insert builder data for development environment
-- This file contains SQL insert statements for the Builder table

-- My Home Group
INSERT INTO "Builder" ("name", "description", "website", "contactInfo") VALUES (
  'My Home Group',
  'Myhome Constructions are a trusted builder in Hyderabad, India, known for on-time completion and superior quality. They have built over 26 million square feet of happy homes and prime commercial properties.',
  'https://www.myhomeconstructions.com',
  '{
    "company": "My Home Constructions Pvt. Ltd",
    "addresses": [
      {
        "type": "corporate",
        "address": "H NO 1-123, 8TH FLOOR, 3RD BLOCK, MY HOME HUB, HITECH CITY, MADHAPUR, HYDERABAD - 500 081"
      }
    ],
    "phones": [
      "+91 91549 81692",
      "+91 91549 81691",
      "+91 91005 59944"
    ],
    "emails": [
      "mktg@myhomeconstructions.com",
      "nri@myhomeconstructions.com"
    ]
  }'::json
);

-- DSR Builders
INSERT INTO "Builder" ("name", "description", "contactInfo") VALUES (
  'DSR Builders',
  'DSR Builders, DSR Infrastructure, DSR Group',
  '{
    "company": "DSR Group",
    "addresses": [
      {
        "type": "hyderabad",
        "address": "Plot 221, Road Number 17, Jawahar Colony, Jubilee Hills, Hyderabad, Telangana – 500 033",
        "mapLink": "https://maps.app.goo.gl/A27pWrh5PRMMeFDu8"
      },
      {
        "type": "bangalore",
        "company": "DSR Infrastructure Private Limited",
        "address": "DSR Techno Cube, Varthur Road, Thubarahalli, Bengaluru, Karnataka – 560 066",
        "mapLink": "https://maps.app.goo.gl/n1rChujnbr4Vn78o6"
      }
    ],
    "phones": [
      {
        "location": "hyderabad",
        "type": "landline",
        "numbers": ["+91-40-2999 2222", "+91-40-2999 2223"]
      },
      {
        "location": "hyderabad",
        "type": "mobile",
        "numbers": ["+91 90001 35707"]
      },
      {
        "location": "bangalore",
        "type": "mobile",
        "numbers": ["+91 90191 92000"]
      },
      {
        "location": "bangalore",
        "type": "landline",
        "numbers": ["+91 80491 23000"]
      }
    ],
    "emails": [
      {
        "email": "hyd@dsrinfra.com",
        "purpose": "For Hyderabad Projects"
      },
      {
        "email": "admin.blr@dsrinfra.com",
        "purpose": "General Enquiries"
      },
      {
        "email": "sales@dsrinfra.com",
        "purpose": "Residential Project Enquiries"
      }
    ]
  }'::json
);

-- Sri Sreenivasa Infra
INSERT INTO "Builder" ("name", "description", "contactInfo") VALUES (
  'Sri Sreenivasa Infra',
  'SSI, Sri Srinivasa Infra, Sree Srinivasa Infra',
  '{
    "company": "SRI SREENIVAS INFRA",
    "addresses": [
      {
        "type": "corporate",
        "address": "1st & 2nd Floor Plot No:506, Road No:10, Avenue 4, Kakatiya Hills, Madhapur, Hyderabad, Telangana- 500081",
        "mapLink": "https://maps.app.goo.gl/ReqHdfsdsM8rUzWq5"
      }
    ],
    "phones": [
      "+91 79 9766 6630",
      "+91 87 9000 9000",
      "+91 79 9766 6690",
      "+91 96 4243 4567"
    ],
    "emails": [
      "sales@srisreenivasa.com"
    ]
  }'::json
);

-- Independent
INSERT INTO "Builder" ("name", "description", "contactInfo") VALUES (
  'Independent',
  'Not Listed, Others',
  '{
    "company": "Independent Builder",
    "note": "This category is for unlisted builders or individual developers"
  }'::json
);