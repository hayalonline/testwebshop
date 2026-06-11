const products = [
  {
    name: "Urban Rugzak",
    slug: "urban-rugzak",
    description: "Waterafstotende rugzak met laptopvak en slimme opbergvakken.",
    price: 79.95,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=80",
    stock: 18,
    category: "Tassen"
  },
  {
    name: "Minimal Desk Lamp",
    slug: "minimal-desk-lamp",
    description: "Dimbare bureaulamp met aluminium afwerking en warm LED-licht.",
    price: 59.5,
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
    stock: 9,
    category: "Wonen"
  },
  {
    name: "Linnen Weekendtas",
    slug: "linnen-weekendtas",
    description: "Ruime weekendtas met verstevigde handvatten en afneembare schouderband.",
    price: 119,
    image: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
    stock: 7,
    category: "Reizen"
  },
  {
    name: "Keramische Mok Set",
    slug: "keramische-mok-set",
    description: "Set van vier handgemaakte mokken met matte glazuurlaag.",
    price: 34.95,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
    stock: 24,
    category: "Keuken"
  },
  {
    name: "Wireless Charger Dock",
    slug: "wireless-charger-dock",
    description: "Snelle draadloze oplader met standaard voor telefoon en earbuds.",
    price: 44.95,
    image: "https://images.unsplash.com/photo-1615526675159-e248c3021d3f?auto=format&fit=crop&w=900&q=80",
    stock: 15,
    category: "Tech"
  },
  {
    name: "Merino Sjaal",
    slug: "merino-sjaal",
    description: "Zachte sjaal van merinowol, lichtgewicht en warm.",
    price: 69,
    image: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=900&q=80",
    stock: 12,
    category: "Mode"
  }
];

export function seedProducts(db) {
  const insert = db.prepare(`
    INSERT INTO products (name, slug, description, price, image, stock, category)
    VALUES (@name, @slug, @description, @price, @image, @stock, @category)
  `);

  db.exec("BEGIN");
  try {
    products.forEach((product) => insert.run(product));
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
