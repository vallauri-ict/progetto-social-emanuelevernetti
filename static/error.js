"use strict"
let $container
let renderer
let camera
let scene
let pinkMat
let L1
let L2
let Ico

window.onload=()=>{
 $container = $('.bola')
 renderer = new THREE.WebGLRenderer({antialias: true,alpha: true})
 camera = new THREE.PerspectiveCamera(80,1,0.1,10000)
 scene = new THREE.Scene()

scene.add(camera)
renderer.setSize(300,300)
renderer.setClearColor( 0xffffff, 0 )
$container.append(renderer.domElement)

// Camera
camera.position.z = 200

// Material
 pinkMat = new THREE.MeshPhongMaterial({
  color      :  new THREE.Color("rgb(255,139,23)"),
  emissive   :  new THREE.Color("rgb(232,23,23)"),
  specular   :  new THREE.Color("rgb(232,23,23)"),
  shininess  :  100,
  shading    :  THREE.FlatShading,
  transparent: 1,
  opacity    : 1
})

 L1 = new THREE.PointLight( 0xffffff, 1)
L1.position.z = 100
L1.position.y = 100
L1.position.x = 100
scene.add(L1)

 L2 = new THREE.PointLight( 0xffffff, 0.8)
L2.position.z = 200
L2.position.y = 400
L2.position.x = -100
scene.add(L2)

 Ico = new THREE.Mesh(new THREE.IcosahedronGeometry(75,1), pinkMat)
Ico.rotation.z = 0.5
scene.add(Ico)


render();
}
function update(){
   Ico.rotation.x+=2/100
   Ico.rotation.y+=2/100
}

// Render
function render() {
  requestAnimationFrame(render)			
  renderer.render(scene, camera)
  update()
}