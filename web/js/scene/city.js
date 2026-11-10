// Manzana urbana compartida: la usan la pantalla de acceso y la generación de su imagen fotorrealista.

/** Construye la manzana en la escena. Devuelve los autos y las personas para animarlos. */
export function buildCity(THREE, kit, scene, sky, { small = false } = {}) {
  const M = kit.kitMaterials(THREE);
  M.setGlow(sky.glow());
  scene.fog.near = 260;
  scene.fog.far = 1600;
  const r = kit.seeded(2026);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), M.grass);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(110, 22), M.paver);
  plaza.rotation.x = -Math.PI / 2;
  plaza.position.set(0, 0.02, 4);
  plaza.receiveShadow = true;
  scene.add(plaza);

  const tower = kit.slimTower(THREE, M, r, { floors: 11 });
  tower.position.set(0, 0, -2);
  const block = kit.apartmentBlock(THREE, M, r, { floors: 3 });
  block.position.set(-31, 0, -1);
  const house = kit.modernHouse(THREE, M, r);
  house.position.set(29, 0, 1);
  scene.add(tower, block, house);
  // Contexto: edificios al fondo para que la manzana se lea como ciudad.
  for (let i = 0; i < 14; i++) {
    const w = 12 + r() * 14; const h = 14 + r() * 46; const d = 12 + r() * 10;
    const b = kit.contextBuilding(THREE, M, r, w, h, d);
    b.position.set(-90 + i * 13 + r() * 6, 0, -34 - r() * 40);
    scene.add(b);
  }
  for (let i = 0; i < 10; i++) {
    const t = kit.tree(THREE, M, r, 0.8 + r() * 0.5);
    t.position.set(-60 + i * 13 + r() * 5, 0, 12 + r() * 2);
    scene.add(t);
  }

  const road = kit.street(THREE, M, r, { length: 220, z: 24 });
  scene.add(road);
  const cars = kit.traffic(THREE, M, r, road.userData.lanes, 220, 6);
  scene.add(cars.group);
  const [walkA, walkB] = road.userData.walks;
  const people = kit.crowd(THREE, r, [
    [[-90, walkA], [90, walkA]], [[90, walkB], [-90, walkB]],
    [[-44, 12], [44, 12]], [[-6, 8], [-6, 14.5], [6, 14.5], [6, 8]],
    [[20, 9], [38, 9], [38, 13], [20, 13]],
  ], small ? 14 : 24);
  scene.add(people.group);

  return { cars, people };
}
