// Manzana urbana compartida por la pantalla de acceso: torre residencial, edificio de apartamentos y
// casas contemporáneas frente a una avenida, con una ciudad real detrás (muros cortina, ladrillo, piedra)
// que se pierde en la bruma del horizonte.

/** Construye la manzana en la escena. Devuelve los autos y las personas para animarlos. */
export function buildCity(THREE, kit, scene, sky, { small = false } = {}) {
  const M = kit.kitMaterials(THREE);
  M.setGlow(sky.glow());
  // Perspectiva aérea: la bruma toma el color real del horizonte del cielo.
  scene.fog.near = 140;
  scene.fog.far = 1100;
  const r = kit.seeded(2026);
  const city = new THREE.Group();

  const plane = (w, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    city.add(m);
    return m;
  };
  // Suelo: ciudad pavimentada al fondo, lote de la manzana y un parque al otro lado de la avenida.
  plane(2400, 2400, M.asphalt, 0, -0.02, 0);
  plane(130, 46, M.paver, 0, 0.0, -6);
  plane(700, 300, M.grass, 0, 0.0, 182);
  for (const x of [-72, 72]) plane(12, 900, M.asphalt, x, 0.005, -400); // calles transversales
  for (const z of [-62, -150, -240]) plane(1400, 10, M.asphalt, 0, 0.004, z);

  const tower = kit.slimTower(THREE, M, r, { floors: 11 });
  tower.position.set(0, 0, -2);
  const block = kit.apartmentBlock(THREE, M, r, { floors: 3 });
  block.position.set(-33, 0, -1);
  const house = kit.modernHouse(THREE, M, r);
  house.position.set(28, 0, 1);
  const house2 = kit.modernHouse(THREE, M, r);
  house2.position.set(51, 0, -3);
  city.add(tower, block, house, house2);

  // Primer plano de la ciudad detrás de la manzana: alturas medias, fachadas variadas.
  for (let i = 0; i < 12; i++) {
    // Más bajos que la torre principal (unos 38 m) para que ella siga siendo la protagonista.
    const w = 14 + r() * 12; const h = 14 + r() * 18; const d = 14 + r() * 8;
    const b = kit.contextBuilding(THREE, M, r, w, h, d, { style: r() < 0.6 ? 'punched' : 'band' });
    b.position.set(-66 + i * 12 + r() * 4, 0, -36 - r() * 14);
    city.add(b);
  }
  // Skyline: manzanas cada vez más altas hacia el fondo, que la bruma va desvaneciendo.
  for (let row = 0; row < 3; row++) {
    const z0 = -120 - row * 130;
    for (let x = -420; x < 420; x += 26 + r() * 16) {
      const w = 16 + r() * 16; const d = 16 + r() * 16;
      // Las torres altas quedan lejos y a los lados: la torre de la manzana sigue siendo la protagonista.
      const tall = row > 0 && Math.abs(x) > 50 && r() < 0.18 + row * 0.12;
      const h = tall ? 45 + r() * (40 + row * 30) : 14 + r() * (18 + row * 8);
      const b = kit.contextBuilding(THREE, M, r, w, h, d, { style: tall ? 'glass' : undefined });
      b.position.set(x, 0, z0 - r() * 40);
      city.add(b);
    }
  }
  // Arborización del lote y del parque.
  for (let i = 0; i < 12; i++) {
    const t = kit.tree(THREE, M, r, 0.8 + r() * 0.45);
    t.position.set(-62 + i * 11 + r() * 4, 0, 13 + r() * 2);
    city.add(t);
  }
  // Parque frente a la avenida: árboles solo en los costados para no tapar las fachadas.
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1;
    const t = kit.tree(THREE, M, r, 0.9 + r() * 0.6);
    t.position.set(side * (62 + r() * 40), 0, 36 + r() * 30);
    city.add(t);
  }

  const road = kit.street(THREE, M, r, { length: 260, z: 24 });
  city.add(road);
  scene.add(city);
  // Todo lo estático se fusiona por material: la escena completa se dibuja en pocas llamadas.
  kit.mergeStatic(THREE, city);

  const cars = kit.traffic(THREE, M, r, road.userData.lanes, 260, small ? 6 : 9);
  scene.add(cars.group);
  const [walkA, walkB] = road.userData.walks;
  const people = kit.crowd(THREE, r, [
    [[-110, walkA], [110, walkA]], [[110, walkB], [-110, walkB]],
    [[-44, 12], [44, 12]], [[-6, 8], [-6, 14.5], [6, 14.5], [6, 8]],
    [[20, 9], [38, 9], [38, 13], [20, 13]], [[-50, 34], [50, 34]],
  ], small ? 16 : 30);
  scene.add(people.group);

  return { cars, people };
}
