var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
enemyInfo = {
    width: 40,
    height: 20,
    count: {
        row: 5,
        col: 9
    },
    offset: {
        top: 100,
        left: 60
    },
    padding: 5
};
//Effet sonore
var move = new Howl({
    src: ['assets/move.mp3']
});

var shootSound = new Howl({
    src: ['assets/shoot.mp3']
});

var explosionSound = new Howl({
    src: ['assets/explosion.mp3']
});
var hitPlayer = new Howl({
    src: ['assets/hasbulla.mp3']
});



function preload() {
    this.load.image("player", "assets/player.png")
    this.load.image("enemy", "assets/enemy.png")
    this.load.image("bullet", "assets/bullet.png")
    this.load.image("starfield", "assets/starfield.png")
}

var score = 0;
var lives = 3;
var isStarted = false;
var ufoCount = 0;
var isEnd = false;
function create() {
    scene = this;
    cursors = scene.input.keyboard.createCursorKeys();

    //---- Background -----//
    background = this.add.image(0, 0, 'starfield').setOrigin(0).setDisplaySize(800,600);
    background.height = 1000;


    //---- Controle du jeux ----//
    //Touche du clavier
    keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    //Click gauche pour tirer
    isShooting = false;
    this.input.click;

    //----- Physic des enemy ------//
    enemys = this.physics.add.staticGroup();


    //------ Joueur -----//
    player = scene.physics.add.sprite(400, 560, 'player');
    player.setCollideWorldBounds(true)

    //Texte du jeux
    scoreText = scene.add.text(16, 16, "Score: " + score, { fontSize: '18px', fill: '#ef75b2' })
    livesText = scene.add.text(696, 16, "Vie(s): " + lives, { fontSize: '18px', fill: '#ef75b2' })
    startText = scene.add.text(400, 300, "Appuyer pour jouer", { fontSize: '18px', fill: '#ef75b2' }).setOrigin(0.5)
    stateText = scene.add.text(400,300,{ fontSize: '50px', fill: '#ef75b2' }).setOrigin(0.5);
    stateText.visible= false;




    //----- Text avant de commencer la partie -----//
    this.input.on('pointerdown', function () {
        if (isStarted === false) {
            isStarted = true;
            startText.destroy()


        } else {
            shoot()
        }
    });
    initEnemys()
}

function update() {
    if (isStarted === true) {
        if (cursors.left.isDown || keyQ.isDown) {
            player.setVelocityX(-160);

        }
        else if (cursors.right.isDown || keyD.isDown) {
            player.setVelocityX(160);

        }
        else {
            player.setVelocityX(0);

        }
    }
}

//------ Tire -----//
function shoot() {
    if (isStarted === true) {
        if (isShooting === false) {
            manageBullet(scene.physics.add.sprite(player.x, player.y, "bullet"))
            isShooting = true;
            shootSound.play()
        }
    }
}

function initEnemys() {
    for (c = 0; c < enemyInfo.count.col; c++) {
        for (r = 0; r < enemyInfo.count.row; r++) {
            var enemyX = (c * (enemyInfo.width + enemyInfo.padding)) + enemyInfo.offset.left;
            var enemyY = (r * (enemyInfo.height + enemyInfo.padding)) + enemyInfo.offset.top;
            enemys.create(enemyX, enemyY, 'enemy').setOrigin(0.5);
        }
    }
}

//------ Mouvement de l'enemy ------//

setInterval(moveEnemys, 1000)
var xTimes = 0;
var yTimes = 0;
var dir = "right"
function moveEnemys() {
    if (isStarted === true) {
        move.play()
        if (xTimes === 20) {
            if (dir === "right") {
                dir = "left"
                xTimes = 0
            } else {
                dir = "right"
                xTimes = 0
            }
        }
        if (dir === "right") {
            enemys.children.each(function (enemy) {

                enemy.x = enemy.x + 10;
                enemy.body.reset(enemy.x, enemy.y);

            }, this);
            xTimes++;
        } else {
            enemys.children.each(function (enemy) {

                enemy.x = enemy.x - 10;
                enemy.body.reset(enemy.x, enemy.y);

            }, this);
            xTimes++;

        }
    }
}

function manageBullet(bullet) {
    bullet.setVelocityY(-380);

    //---- Physic Bullet -> enemy ----//
    var i = setInterval(function () {
        enemys.children.each(function (enemy) {

            if (checkOverlap(bullet, enemy)) {
                bullet.destroy();
                clearInterval(i)
                isShooting = false
                enemy.destroy()
                score++;
                scoreText.setText("Score: " + score);

                explosionSound.play()

                if ((score - ufoCount) === (enemyInfo.count.col * enemyInfo.count.row)) {
                    end("Win")
                }
            }

        }, this);

    }, 10)
}
var enemyBulletVelo = 200;
//---- Physic BulletEnemy -> player ----//
function manageEnemyBullet(bullet, enemy) {
    var angle = Phaser.Math.Angle.BetweenPoints(enemy, player);
    scene.physics.velocityFromRotation(angle, enemyBulletVelo, bullet.body.velocity);
    enemyBulletVelo = enemyBulletVelo + 2
    var i = setInterval(function () {

        if (checkOverlap(bullet, player)) {
            bullet.destroy();
            clearInterval(i);
            lives--;
            livesText.setText("Vie(s): " + lives);
            hitPlayer.play()

            //Si les vies sont à 0 alors perdu
            if (lives == 0) {
                end("perdu")
            }
        }
        if (score === (enemyInfo.count.col * enemyInfo.count.row)) {
            end("gagner")
        }
    }, 3)


}
//----- HitBox ----//
function checkOverlap(spriteA, spriteB) {
    var boundsA = spriteA.getBounds();
    var boundsB = spriteB.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(boundsA, boundsB);
}

//---- Tir des enemy -----//
setInterval(enemyFire, 3000)

function enemyFire() {
    if (isStarted === true) {
        var enemy = enemys.children.entries[Phaser.Math.Between(0, enemys.children.entries.length - 1)];
        manageEnemyBullet(scene.physics.add.sprite(enemy.x, enemy.y, "bullet"), enemy)
    }
}

//Fonction fin
function end(t) {
    explosionSound.stop();
    hitPlayer.stop();
    shootSound.stop();
    move.stop()
    //Test fin


    // stateText.visible= true;
    // stateText.setText(`Tu à ${t} ! Score: ` + score ,{ fontSize: '50px', fill: '#ef75b2' });
    alert(`Tu à ${t} ! Score: ` + score );
    location.reload();
    // stateText.destroy().interval(1);



}