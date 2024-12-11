import * as THREE from 'three'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { createNoise2D  } from 'simplex-noise';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let camera, scene, renderer;

//setting of keyword label and conLine
const labelRepository = [];
let labelNumber = 4;
const labelPositions = [];
const point = new THREE.Vector3();

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const onUpPosition = new THREE.Vector2();

const ARC_SEGMENTS = 10;
const splines = {};

let transformControl;
let gui;
let isDragging = false;

const noise2D = createNoise2D();

let controls;
let isFirstPersonMode = false;
let pointerControls;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
let prevTime = performance.now();

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

//setting of control
const params = {
    chordal: true,
    addLabel: function () {
        const color = new THREE.Color(params.labelColor);
        createLabel(color);
    },
    removeLabel: removeLabel,
    labelColor: '#ffffff',
    textColor: '#000000',
    newLabelText: "default text"
};

let selectedLabel = null;
let labelGui = new GUI();
labelGui.domElement.style.position = 'absolute';
labelGui.domElement.style.top = '0px';
labelGui.domElement.style.left = '0px';
labelGui.domElement.style.display = 'none';
document.body.appendChild(labelGui.domElement);

init();

function init() {
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 600, 300, -400 );
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x171717 );

    initPointerControls();

    //ground
    const groundGrid = new THREE.GridHelper(5000, 100, 0xFFFFFF, 0xFFFFFF);
    groundGrid.material.transparent = true;
    groundGrid.material.opacity = 0.3;
    scene.add(groundGrid);

    //all text
    const FONTloader = new FontLoader();
    FONTloader.load('fonts/helvetiker_regular.typeface.json', function (font) {
        const textColor = 0xFFFFFF;
        const matLine = new THREE.LineBasicMaterial({
            color: textColor,
            side: THREE.DoubleSide
        });
        const noiseStrength = 5;

        const message1 = 'INTRODUCTION\n\n\n\n\n\nWhenever and wherever individuals and groups\n\n\ndeploy and communicate with digital media,\n\n\nthere will be circulations, reimaginings, magn-\n\n\nifications, deletions, translations, revisionings,\n\n\nand remakings of a range of cultural repre-\n\n\nsentations, experiences, and identities, but the\n\n\nprecise ways that these dynamics unfold can\n\n\nnever be fully anticipated in advance. In some\n\n\ninstances, digital media have extended their\n\n\nreach into the mundane heart of everyday life,\n\n\nmost visibly with cell phones—gadgets now vital\n\n\n to conduct business affairs in remote areas\n\n\n of the world, as well as in bustling global\n\n\ncities. In other instances, digital artifacts have\n\n\nhelped engender new collectivities: Web-cam\n\n\ngirls, gamers, hackers, and others, whose senses\n\n\nof self, vocation, and group sociabilities are\n\n\nshaped significantly, although not exclusively\n\n\nnor deterministically, by digital technologies.\n\n\n\nThe diversity and pervasiveness of digital\n\n\nmedia can make them more difficult to study,\n\n\nbut also can make them compelling objects\n\n\nof ethnographic inquiry. Still, anthropologists\n\n\nhave been slow to enter this terrain—at least\n\n\nuntil recently, when the trickle of 1990s publi-\n\n\ncations became a steady stream. Here I survey\n\n\nand divide this growing ethnographic corpus on\n\n\ndigital media into three broad but overlap-\n\n\nping categories. The first category explores the\n\n\nrelationship between digital media and what\n\n\n';

        const message2 = 'might be called the cultural politics of media.\n\n\nThis work examines how cultural identities,\n\n\nrepresentations, and imaginaries, such as those\n\n\nhinged to youth, diaspora, nation, and indi-\n\n\ngeneity, are remade, subverted, communicated,\n\n\nand circulated through individual and collec-\n\n\ntive engagement with digital technologies. The\n\n\nsecond category explores the vernacular cul-\n\n\ntures of digital media, evinced by discrepant\n\n\nphenomena, digital genres, and groups—\n\n\nhackers, blogging, Internet memes, and mi-\n\n\ngrant programmers—whose logic is organized\n\n\nsignificantly around, although not necessarily\n\n\ndetermined by, selected properties of digital\n\n\nmedia. The final category, what I call prosaics\n\n\nof digital media, examines how digital media\n\n\nfeed into, reflect, and shape other kinds of so-\n\n\ncial practices, like economic exchange, finan-\n\n\ncial markets, and religious worship. Attention\n\n\nto these rituals, broad contexts, and the material\n\n\ninfrastructures and social protocols that enable\n\n\nthem illuminates how the use and production of\n\n\ndigital media have become integrated into\n\n\neveryday cultural, linguistic, and economic life.\n\n\n\nThe distinctions I draw among these three\n\n\nfields should not imply that they are neat and\n\n\ntidy categories; indeed anthropological work in\n\n\nthe past two decades has often contested these\n\n\nboundaries. Even though groupings such as the\n\n\nprosaics of digital media and the vernacular cul-\n\n\nture of digital media overlap, I use the terms\n\n\nprovisionally and tactically to emphasize differ-\n\n\nent frames of analysis that have been brought to\n\n\nbear on the ethnographic study of digital media.\n\n\nTo grasp more fully the broader significance\n\n\nof digital media, its study must involve various\n\n\nframes of analysis, attention to history, and the'

        function createVerticalLines(message, font, material, startPosition) {
            const lines = message.split('\n');
    
            lines.forEach((line, index) => {
                const shapes = font.generateShapes(line, 10);
                const geometry = new THREE.ShapeGeometry(shapes);
                geometry.computeBoundingBox();
                const xMid = -geometry.boundingBox.min.x;
                geometry.translate(xMid, 0, 0);
    
                applyNoiseToGeometry(geometry, noiseStrength);
    
                const textMesh = new THREE.Mesh(geometry, material);
                textMesh.rotation.y = Math.PI / 2;
                textMesh.position.y = startPosition.y;
                textMesh.position.x = startPosition.x + index * 20;
                textMesh.position.z = startPosition.z;
    
                scene.add(textMesh);
            });
        }
        
        const startPosition1 = new THREE.Vector3(0, 0, 0);
        const startPosition2 = new THREE.Vector3(-300, 0, -310);
    
        createVerticalLines(message1, font, matLine, startPosition1);
        createVerticalLines(message2, font, matLine, startPosition2);

        //setting of conLine
        for ( let i = 0; i < labelNumber; i ++ ) {
            addLabel( labelPositions[ i ] );
        }
        labelPositions.length = 0;

        for ( let i = 0; i < labelNumber; i ++ ) {
            labelPositions.push( labelRepository[ i ].position);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array( ARC_SEGMENTS * 3 ), 3 ) );
        
        const colors = [];
        for (let i = 0; i < ARC_SEGMENTS; i++) {
            const t = i / (ARC_SEGMENTS - 1);
            const labelIndex = Math.floor(t * (labelRepository.length - 1));
            const labelColor = new THREE.Color(labelRepository[labelIndex].currentColor);

            colors.push(labelColor.r, labelColor.g, labelColor.b);
        }
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

        let conLine = new THREE.CatmullRomCurve3 (labelPositions);
        conLine.curveType = 'chordal';
        conLine.mesh = new THREE.Line( geometry.clone(), new THREE.LineBasicMaterial( {
            vertexColors: true,
            transparent: true,
            opacity: 0.35
        } ) );
        splines.chordal = conLine;
        
        //add label and conLine to scene
        for ( const k in splines ) {
            const spline = splines[ k ];
            scene.add( spline.mesh );
        }
        load( [ 
            new THREE.Vector3(100, 50, -100),
            new THREE.Vector3(150, 150, -200),
            new THREE.Vector3(350, 200, -150),
            new THREE.Vector3(400, 300, -500) 
        ] );

        render();

        controls.addEventListener( 'change', render );
        window.addEventListener( 'resize', onWindowResize );
    } ); // end load function

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize( window.innerWidth, window.innerHeight);
    document.body.appendChild( renderer.domElement );

    animate();

    //control panel
    gui = new GUI();
    document.body.appendChild(gui.domElement);

    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '0px';
    gui.domElement.style.left = '0px';
    gui.domElement.style.display = 'none';

    gui.addColor(params, 'labelColor');
    gui.addColor(params, 'textColor');
    gui.add(params, 'newLabelText').name('Next Label Text');
    gui.add( params, 'addLabel' );
    gui.add( params, 'removeLabel' );

    gui.add({ toggleFirstPerson }, 'toggleFirstPerson').name('First Person Mode');

    gui.open;

    document.addEventListener('click', (event) => {
        if (!gui.domElement.contains(event.target)) {
            gui.domElement.style.display = 'none';
        }
    });

    document.addEventListener('contextmenu', (event) => {
        event.preventDefault();
    
        pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
        pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(labelRepository, false);
    
        if (intersects.length > 0) {
            selectedLabel = intersects[0].object;
            updateLabelGui(selectedLabel);
    
            labelGui.domElement.style.top = `${event.clientY}px`;
            labelGui.domElement.style.left = `${event.clientX}px`;
            labelGui.domElement.style.display = 'block';
    
            gui.domElement.style.display = 'none';
        } else {
            selectedLabel = null;
            labelGui.domElement.style.display = 'none';
    
            gui.domElement.style.top = `${event.clientY}px`;
            gui.domElement.style.left = `${event.clientX}px`;
            gui.domElement.style.display = 'block';
        }
    });

    document.addEventListener('keydown', (event) => {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                moveForward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                moveBackward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                moveLeft = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                moveRight = true;
                break;
            case 'Space':
                if (canJump) velocity.y += 350;
                canJump = false;
                break;
            case 'Escape':
                if (isFirstPersonMode) {
                    isFirstPersonMode = false;
                    pointerControls.unlock();
                    enableInteractions();
                    console.log("Exited First Person Mode via Escape.");
                }
                break;
        }
    });
    
    document.addEventListener('keyup', (event) => {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                moveForward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                moveBackward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                moveLeft = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                moveRight = false;
                break;
        }
    });
    

    //pos controls
    controls = new OrbitControls( camera, renderer.domElement );
    controls.damping = 0.2;
    controls.target.set( 0, 0, 0 );
    controls.update();

    controls.addEventListener('end', () => {
        if (labelGui && labelGui.domElement.style.display === 'block') {
            labelGui.domElement.style.display = 'none';
        }
    });

    transformControl = new TransformControls( camera, renderer.domElement );
    transformControl.addEventListener( 'change', render );
    transformControl.addEventListener( 'dragging-changed', function ( event ) {
        controls.enabled = ! event.value;
    } );
    scene.add( transformControl.getHelper() );
    transformControl.addEventListener( 'objectChange', function () {
        update();
    } );

    document.addEventListener( 'pointerdown', onPointerDown );
    document.addEventListener( 'pointerup', onPointerUp );
    document.addEventListener( 'pointermove', onPointerMove );
    window.addEventListener( 'resize', onWindowResize );

} // end init

function applyNoiseToGeometry(geometry, noiseStrength) {
    const position = geometry.attributes.position;
    const array = position.array;

    const frequency = 0.02;
    const offsetX = Math.random() * 100;
    const offsetZ = Math.random() * 100;

    const lineHeight = 10;
    const randomOffsets = {};

    for (let i = 0; i < array.length; i += 3) {
        const x = array[i];
        const z = array[i + 2];

        const lineKey = Math.floor(z / lineHeight);
        if (!(lineKey in randomOffsets)) {
            randomOffsets[lineKey] = (Math.random() - 0.5) * noiseStrength *0.5;
        }
        const lineOffset = randomOffsets[lineKey];
        
        const yOffset = (noise2D(x * frequency + offsetX, z * frequency + offsetZ) * noiseStrength * 1.5) +
                        lineOffset +
                        (Math.random() - 0.5) * noiseStrength * 0.1;
        array[i + 1] += yOffset;
    }
    position.needsUpdate = true;
}

function updateLabelGui(label) {
    if (labelGui.domElement && labelGui.domElement.parentNode) {
        labelGui.domElement.parentNode.removeChild(labelGui.domElement);
    }

    labelGui = new GUI();
    labelGui.domElement.style.position = 'absolute';
    labelGui.domElement.style.top = '0px';
    labelGui.domElement.style.left = '0px';
    labelGui.domElement.style.display = 'block';
    document.body.appendChild(labelGui.domElement);

    labelGui.addColor({ color: label.currentColor }, 'color')
        .name('Label Color')
        .onChange((value) => {
            const canvas = label.material.map.image;
            const ctx = canvas.getContext('2d');

            ctx.fillStyle = value;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            label.material.map.needsUpdate = true;
            label.currentColor = value;

            update();
            render();
        });

    labelGui.addColor({ textColor: params.textColor }, 'textColor')
    .name('Label Text Color')
    .onChange((value) => {
        const canvas = label.material.map.image;
        const ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = label.currentColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = value;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = "Bold 64px Arial";
        ctx.fillText(params.newLabelText, canvas.width / 2, canvas.height / 2);

        label.material.map.needsUpdate = true;
        params.textColor = value;

        update();
        render();
    });
        
    labelGui.add({ text: 'Edit Text' }, 'text')
        .name('Label Text')
        .onFinishChange((value) => {
            const canvas = label.material.map.image;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = label.currentColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = params.textColor;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = "Bold 64px Arial";
            ctx.fillText(value, canvas.width / 2, canvas.height / 2);

            label.material.map.needsUpdate = true;
            update();
            render();
        });

    labelGui.add({ remove: () => removeSelectedLabel() }, 'remove').name('Remove Label');
}

function removeSelectedLabel() {
    if (selectedLabel) {
        const index = labelRepository.indexOf(selectedLabel);
        if (index !== -1) {
            labelRepository.splice(index, 1);
            labelPositions.splice(index, 1);

            selectedLabel.geometry.dispose();
            selectedLabel.material.dispose();
            scene.remove(selectedLabel);

            selectedLabel = null;
            labelGui.domElement.style.display = 'none';

            update();
            render();
        }
    }
}
function addLabel(
    text = params.newLabelText,
    position = new THREE.Vector3(0, 0, 0),
    fontStyle = "Bold 64px Arial",
    textColor = params.textColor,
    backgroundColor = params.labelColor,
    padding = 20
) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // label font setting
    ctx.font = fontStyle;
    const textWidth = ctx.measureText(text).width;
    const fontSize = parseInt(fontStyle.match(/\d+/)[0]);
    canvas.width = textWidth + padding * 3;
    canvas.height = fontSize + padding * 2;
    ctx.font = fontStyle;

    // label bkground
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // Sprite
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));

    // label size and pos
    label.scale.set(canvas.width / 10, canvas.height / 10, 1);
    label.position.copy(position);

    label.currentColor = backgroundColor;

    scene.add(label);
    labelRepository.push(label);
    return label;
}

function createLabel(){
    labelNumber ++;

    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    const distanceFromCamera = 800;
    const position = camera.position.clone().add(cameraDirection.multiplyScalar(distanceFromCamera));

    labelPositions.push(addLabel(params.newLabelText, position).position);
    update();
    render();
}

function removeLabel (){
    const label = labelRepository.pop();
    if (label) {
        label.geometry.dispose();
        label.material.dispose();
        scene.remove(label);
        labelPositions.pop();
    }
    update();
    render();
}

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveForward = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveBackward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = true;
            break;
        case 'Space':
            if (canJump) velocity.y += 350;
            canJump = false;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            moveForward = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            moveBackward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            moveLeft = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            moveRight = false;
            break;
    }
}

function initPointerControls() {
    pointerControls = new PointerLockControls(camera, document.body);

    pointerControls.addEventListener('lock', () => {
        console.log("PointerLockControls: Locked");
    });

    pointerControls.addEventListener('unlock', () => {
        console.log("PointerLockControls: Unlocked");
    });

    scene.add(pointerControls.object);
}

function disableInteractions() {
    document.removeEventListener('pointerdown', onPointerDown);
    document.removeEventListener('pointerup', onPointerUp);
    document.removeEventListener('pointermove', onPointerMove);

    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);

    transformControl.enabled = false;
    controls.enabled = false;
}

function enableInteractions() {
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('pointermove', onPointerMove);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    transformControl.enabled = true;
    controls.enabled = true;
    console.log("Interactions enabled, OrbitControls restored.");
}

function toggleFirstPerson() {
    if (!pointerControls) {
        console.error("PointerLockControls not initialized");
        return;
    }

    isFirstPersonMode = !isFirstPersonMode;

    if (isFirstPersonMode) {
        pointerControls.lock();
        controls.enabled = false;
        gui.domElement.style.display = 'none';
        disableInteractions();
    } else {
        pointerControls.unlock();
        controls.enabled = true;
        gui.domElement.style.display = 'block';
        enableInteractions();
    }
}

function animate() {
    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    if (isFirstPersonMode && pointerControls.isLocked) { // 使用 isLocked
        handleFirstPersonMovement(delta);
    }

    prevTime = time;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function handleFirstPersonMovement(delta) {
    if (!isFirstPersonMode || !pointerControls.isLocked) {
        return; // Exit if not in first-person mode or pointer is not locked
    }

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    velocity.x -= velocity.x * 10.0 * delta; // Apply damping
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // Simulate gravity

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    pointerControls.moveRight(-velocity.x * delta); // Move horizontally
    pointerControls.moveForward(-velocity.z * delta); // Move forward/backward

    // Update vertical position for gravity effect
    pointerControls.object.position.y += velocity.y * delta;

    // Prevent falling through the ground
    if (pointerControls.object.position.y < 10) {
        velocity.y = 0;
        pointerControls.object.position.y = 10; // Set minimum height
        canJump = true;
    }
}

function update (){
    for (const k in splines){
        const spline = splines [k];
        const splineMesh = spline.mesh;
        const position = splineMesh.geometry.attributes.position;
        const colors = [];
        //from '0' to '1', from startPoint to endPoint, 't' is the location of the point in a line
        for ( let i = 0; i < Math.min(ARC_SEGMENTS, 50); i ++ ) {
            const t = i / ( ARC_SEGMENTS - 1 );
            spline.getPoint( t, point );
            position.setXYZ( i, point.x, point.y, point.z );

            const labelIndex = Math.floor(t * (labelRepository.length - 1));
            const labelColor = new THREE.Color(labelRepository[labelIndex].material.map.image.currentColor);
            colors.push(labelColor.r, labelColor.g, labelColor.b);
        }
        position.needsUpdate = true;

        if (!splineMesh.geometry.attributes.color) {
            const colorAttribute = new THREE.BufferAttribute(new Float32Array(colors), 3);
            splineMesh.geometry.setAttribute('color', colorAttribute);
        } else {
            splineMesh.geometry.attributes.color.array.set(new Float32Array(colors));
            splineMesh.geometry.attributes.color.needsUpdate = true;
        }
        splineMesh.material.vertexColors = true;
    }
};

function load (new_labelPositions){
    if (!new_labelPositions || !Array.isArray(new_labelPositions)) {
        return;
    }

    while ( new_labelPositions.length > labelPositions.length ) {
        addLabel();
    }

    while ( new_labelPositions.length < labelPositions.length ) {
        removeLabel();
    }

    for ( let i = 0; i < labelPositions.length; i ++ ) {
        if (!labelPositions[i] || !new_labelPositions[i]) {
            continue;
        }
        labelPositions[i].copy(new_labelPositions[i]);
    }
    update();
}

function render(){
    if (splines.chordal && splines.chordal.mesh) {
        splines.chordal.mesh.visible = params.chordal;
    }
    renderer.render( scene, camera );
}

function onPointerDown( event ) {
    if (event.button === 2) {
        gui.domElement.style.display = 'none';
    } else if (event.button === 0) {
        isDragging = false;
    }
}

function onPointerUp( event ) {
    onUpPosition.x = event.clientX;
    onUpPosition.y = event.clientY;
    if ( !isDragging ) {
        transformControl.detach();
    }
}

function onPointerMove( event ) {
    pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    raycaster.setFromCamera( pointer, camera );
    const intersects = raycaster.intersectObjects( labelRepository, false );

    if ( intersects.length > 0 ) {
        const object = intersects[ 0 ].object;
        if ( object !== transformControl.object ) {
            transformControl.attach( object );
        }
    } 
}

transformControl.addEventListener('dragging-changed', function (event) {
    isDragging = event.value;
});

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth , window.innerHeight);

    render();
}
