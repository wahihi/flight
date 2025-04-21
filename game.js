// 1942 Game - based on MAME source code analysis

// 게임 상수 (MAME 소스 코드 분석 기반)
const CONSTANTS = {
    PLAYER_SPEED: 300,
    BULLET_SPEED: 500,
    ENEMY_BULLET_SPEED: 250,
    BASIC_ENEMY_SPEED: 150,
    BOMBER_ENEMY_SPEED: 120,
    BOSS_ENEMY_SPEED: 80,
    POWERUP_SPEED: 100,
    BASIC_ENEMY_HEALTH: 1,
    BOMBER_ENEMY_HEALTH: 3,
    BOSS_ENEMY_HEALTH: 20,
    LOOP_DURATION: 1000,
    LOOP_INVULNERABILITY: 500,
    HIT_INVULNERABILITY: 2000,
    BASIC_ENEMY_SCORE: 100,
    BOMBER_ENEMY_SCORE: 300,
    BOSS_ENEMY_SCORE: 2000,
    INITIAL_LIVES: 3,
    INITIAL_LOOPS: 3,
    STARTING_LEVEL: 1,
    STARTING_POWER: 1,
    MAX_POWER_LEVEL: 3,
    ENEMY_SPAWN_DELAY: 1500,
    BOMBER_SPAWN_DELAY: 6000,
    BOSS_SPAWN_DELAY: 30000,
    BULLET_FIRE_DELAY: 300,
    SCROLL_SPEED: 2
};

// 간단하게 만든 BootScene - 초기 설정
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }
    
    preload() {
        // 로딩 화면에 필요한 기본적인 에셋 생성
        this.load.image('background', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    }
    
    create() {
        // 바로 프리로드 씬으로 이동
        this.scene.start('PreloadScene');
    }
}

// Preload Scene - 모든 게임 에셋 로드
class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
    }
    
    preload() {
        // 로딩 진행 상태 표시
        const loadingBar = document.getElementById('loading-bar');
        const loadingText = document.getElementById('loading-text');
        
        this.load.on('progress', (value) => {
            loadingBar.style.width = (value * 100) + '%';
            loadingText.textContent = `로딩 중... ${Math.floor(value * 100)}%`;
        });
        
        this.load.on('complete', () => {
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('main-menu').style.display = 'flex';
        });
        
        // 인라인 간단한 에셋 생성 (실제 에셋 대신 간단한 도형 사용)
        this.createInlineAssets();
    }
    
    createInlineAssets() {
        // 1x1 픽셀 이미지를 다양한 색상으로 생성
        const colors = {
            blue: '0000ff',
            red: 'ff0000',
            green: '00ff00',
            white: 'ffffff',
            yellow: 'ffff00',
            purple: '800080'
        };
        
        // 각각의 색상에 대한 단색 이미지 생성
        Object.entries(colors).forEach(([name, color]) => {
            const dataURL = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==`;
            this.textures.addBase64(`color-${name}`, dataURL);
        });
        
        // 간단한 스프라이트시트 생성 (실제 스프라이트시트 대신 단색 스프라이트 사용)
        this.createBlankSpriteSheet('player', 'color-blue', 32, 32, 6);
        this.createBlankSpriteSheet('enemies', 'color-red', 32, 32, 8);
        this.createBlankSpriteSheet('explosions', 'color-yellow', 64, 64, 6);
        
        // 단일 이미지 생성
        this.textures.addBase64('bullet', `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAYAAADED76LAAAAJklEQVQYV2NkIAAYGRkZ/oMMIKQAJIhNEUgRToXYNJGmEQZG7j4AvlsLITNbUB0AAAAASUVORK5CYII=`);
        this.textures.addBase64('powerup', `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAmElEQVQ4T2NkoBAwUqifYfAYEBsby+Do6MjQ3t4O9jZID4jGBUAGgDTC5P7/Z2D49esXWAyXASBFIJvRDYEZQrQBIK+CbAYZAuJjM4RoA9AMwWUISQbA1IIMgQUmzBCSXQDzCrIhJBsAMwTkCpIMgHkFZAjRBoAMB3kdRnO6JLYYAHodHdNkAMgVhDCxLiAmJWMzAAD44Uz3e1wmXQAAAABJRU5ErkJggg==`);
        this.textures.addBase64('sea', `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAMklEQVRYR+3QQREAAAjDMCYG/DsEGXxSBb2ke7YeiwECBAgQIECAAAECBAgQIEDgU2CofACeWYLG/wAAAABJRU5ErkJggg==`);
    }
    
    // 단색 스프라이트시트 생성 헬퍼 함수
    createBlankSpriteSheet(key, baseTextureKey, frameWidth, frameHeight, frames) {
        const texture = this.textures.get(baseTextureKey);
        const source = texture.source[0];
        
        // 스프라이트시트 생성
        const sheet = this.textures.createCanvas(key, frameWidth * frames, frameHeight);
        const context = sheet.getContext();
        
        // 프레임 생성
        for(let i = 0; i < frames; i++) {
            context.drawImage(source.image, i * frameWidth, 0, frameWidth, frameHeight);
        }
        
        // 스프라이트시트 완성
        sheet.refresh();
        
        // 프레임 정보 추가
        this.textures.get(key).add('frame', 0, 0, 0, frameWidth, frameHeight, frames, 0);
    }
    
    create() {
        // 애니메이션 생성
        this.createAnimations();
        
        // 타이틀 씬으로 이동
        this.scene.start('TitleScene');
    }
    
    createAnimations() {
        // 플레이어 애니메이션
        this.anims.create({
            key: 'player-idle',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
            frameRate: 5,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player-left',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
            frameRate: 5,
            repeat: -1
        });
        
        this.anims.create({
            key: 'player-right',
            frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
            frameRate: 5,
            repeat: -1
        });
        
        // 폭발 애니메이션
        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosions', { start: 0, end: 5 }),
            frameRate: 10,
            repeat: 0
        });
        
        // 적 애니메이션
        this.anims.create({
            key: 'enemy-basic',
            frames: this.anims.generateFrameNumbers('enemies', { start: 0, end: 1 }),
            frameRate: 5,
            repeat: -1
        });
        
        this.anims.create({
            key: 'enemy-bomber',
            frames: this.anims.generateFrameNumbers('enemies', { start: 2, end: 3 }),
            frameRate: 5,
            repeat: -1
        });
        
        this.anims.create({
            key: 'enemy-boss',
            frames: this.anims.generateFrameNumbers('enemies', { start: 4, end: 5 }),
            frameRate: 5,
            repeat: -1
        });
    }
}

// Title Scene - 메인 메뉴
class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
    }
    
    create() {
        // 메뉴 버튼 이벤트 연결
        document.getElementById('start-button').addEventListener('click', () => {
            document.getElementById('main-menu').style.display = 'none';
            this.scene.start('GameScene');
        });
    }
}

// Game Scene - 메인 게임플레이
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }
    
    create() {
        // 게임 상태
        this.gameState = {
            score: 0,
            lives: CONSTANTS.INITIAL_LIVES,
            level: CONSTANTS.STARTING_LEVEL,
            loops: CONSTANTS.INITIAL_LOOPS,
            power: CONSTANTS.STARTING_POWER,
            gameOver: false
        };
        
        // 모바일 입력 상태 초기화
        this.mobileInput = {
            up: false,
            down: false,
            left: false,
            right: false,
            fire: false
        };
        
        // 배경 생성
        this.createBackground();
        
        // 플레이어 생성
        this.createPlayer();
        
        // 그룹 생성
        this.createGroups();
        
        // UI 생성
        this.createUI();
        
        // 충돌 설정
        this.setupCollisions();
        
        // 적 스폰 설정
        this.setupEnemySpawning();
        
        // 입력 설정
        this.setupInput();
        
        // 모바일 컨트롤 설정
        this.setupMobileControls();
    }
    
    createBackground() {
        // 배경 타일 스프라이트 (스크롤 효과)
        this.background = this.add.tileSprite(0, 0, 800, 600, 'sea')
            .setOrigin(0)
            .setScrollFactor(0);
    }
    
    createPlayer() {
        // 플레이어 스프라이트 생성
        this.player = this.physics.add.sprite(400, 500, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(1.5);
        this.player.play('player-idle');
        
        // 플레이어 상태
        this.playerState = {
            isLooping: false,
            isInvulnerable: false,
            canFire: true,
            lastFired: 0
        };
    }
    
    createGroups() {
        // 총알 그룹
        this.playerBullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();
        
        // 적 그룹
        this.enemies = this.physics.add.group();
        this.bosses = this.physics.add.group();
        
        // 파워업 그룹
        this.powerups = this.physics.add.group();
    }
    
    createUI() {
        // 점수 텍스트
        this.scoreText = this.add.text(20, 20, `점수: ${this.gameState.score}`, {
            fontSize: '24px',
            fill: '#ffffff'
        });
        
        // 생명 텍스트
        this.livesText = this.add.text(20, 60, `생명: ${this.gameState.lives}`, {
            fontSize: '24px',
            fill: '#ffffff'
        });
        
        // 회피기동 텍스트
        this.loopsText = this.add.text(20, 100, `회피기동: ${this.gameState.loops}`, {
            fontSize: '24px',
            fill: '#ffffff'
        });
        
        // 파워 레벨 텍스트
        this.powerText = this.add.text(20, 140, `파워: ${this.gameState.power}`, {
            fontSize: '24px',
            fill: '#ffffff'
        });
    }
    
    setupCollisions() {
        // 플레이어 총알과 적 충돌
        this.physics.add.collider(this.playerBullets, this.enemies, this.hitEnemy, null, this);
        this.physics.add.collider(this.playerBullets, this.bosses, this.hitEnemy, null, this);
        
        // 적 총알과 플레이어 충돌
        this.physics.add.collider(this.enemyBullets, this.player, this.hitPlayer, null, this);
        
        // 적과 플레이어 충돌
        this.physics.add.collider(this.enemies, this.player, this.hitPlayer, null, this);
        this.physics.add.collider(this.bosses, this.player, this.hitPlayer, null, this);
        
        // 파워업과 플레이어 충돌
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
    }
    
    setupEnemySpawning() {
        // 기본 적 스폰 타이머
        this.enemyTimer = this.time.addEvent({
            delay: CONSTANTS.ENEMY_SPAWN_DELAY,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });
        
        // 보스 스폰 타이머
        this.bossTimer = this.time.addEvent({
            delay: CONSTANTS.BOSS_SPAWN_DELAY,
            callback: this.spawnBoss,
            callbackScope: this,
            loop: true
        });
    }
    
    setupInput() {
        // 키보드 입력
        this.cursors = this.input.keyboard.createCursorKeys();
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.loopKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    }
    
    setupMobileControls() {
        // 모바일 D-패드 버튼
        const upBtn = document.querySelector('.d-pad-up');
        const downBtn = document.querySelector('.d-pad-down');
        const leftBtn = document.querySelector('.d-pad-left');
        const rightBtn = document.querySelector('.d-pad-right');
        const fireBtn = document.getElementById('fire-button');
        const loopBtn = document.getElementById('loop-button');
        
        if (upBtn) {
            upBtn.addEventListener('touchstart', () => this.mobileInput.up = true);
            upBtn.addEventListener('touchend', () => this.mobileInput.up = false);
        }
        
        if (downBtn) {
            downBtn.addEventListener('touchstart', () => this.mobileInput.down = true);
            downBtn.addEventListener('touchend', () => this.mobileInput.down = false);
        }
        
        if (leftBtn) {
            leftBtn.addEventListener('touchstart', () => this.mobileInput.left = true);
            leftBtn.addEventListener('touchend', () => this.mobileInput.left = false);
        }
        
        if (rightBtn) {
            rightBtn.addEventListener('touchstart', () => this.mobileInput.right = true);
            rightBtn.addEventListener('touchend', () => this.mobileInput.right = false);
        }
        
        if (fireBtn) {
            fireBtn.addEventListener('touchstart', () => this.mobileInput.fire = true);
            fireBtn.addEventListener('touchend', () => this.mobileInput.fire = false);
        }
        
        if (loopBtn) {
            loopBtn.addEventListener('touchstart', () => this.doLoop());
        }
        
        // 모바일 여부 확인하여 컨트롤 표시
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            const mobileControls = document.querySelector('.mobile-controls');
            if (mobileControls) {
                mobileControls.style.display = 'block';
            }
        }
    }
    
    spawnEnemy() {
        if (this.gameState.gameOver) return;
        
        // 레벨에 따라 적 수 증가
        const enemyCount = 1 + Math.floor(this.gameState.level / 3);
        
        for (let i = 0; i < enemyCount; i++) {
            // 랜덤 위치
            const x = Phaser.Math.Between(50, 750);
            const enemy = this.enemies.create(x, -50, 'enemies');
            
            // 적 속성 설정
            enemy.setScale(1.5);
            enemy.health = CONSTANTS.BASIC_ENEMY_HEALTH;
            enemy.play('enemy-basic');
            
            // 레벨에 따른 속도 증가
            const speedMultiplier = 1 + (this.gameState.level * 0.1);
            enemy.setVelocityY(CONSTANTS.BASIC_ENEMY_SPEED * speedMultiplier);
            
            // 좌우 움직임 추가
            if (Phaser.Math.Between(0, 1)) {
                enemy.setVelocityX(Phaser.Math.Between(-50, 50));
            }
            
            // 화면 밖으로 나가면 제거
            enemy.checkWorldBounds = true;
            enemy.outOfBoundsKill = true;
            
            // 랜덤하게 총알 발사
            if (Phaser.Math.Between(0, 100) < 30) {
                this.time.addEvent({
                    delay: Phaser.Math.Between(1000, 3000),
                    callback: () => {
                        if (enemy.active && !this.gameState.gameOver) {
                            this.enemyShoot(enemy);
                        }
                    },
                    callbackScope: this
                });
            }
        }
    }
    
    spawnBoss() {
        if (this.gameState.gameOver || this.bosses.getLength() > 0 || this.gameState.level < 3) return;
        
        // 보스 생성
        const boss = this.bosses.create(400, -100, 'enemies');
        boss.setScale(3);
        boss.setTint(0xff0000);
        boss.health = CONSTANTS.BOSS_ENEMY_HEALTH + (this.gameState.level * 5);
        boss.play('enemy-boss');
        
        // 보스 움직임
        boss.setVelocityY(CONSTANTS.BOSS_ENEMY_SPEED);
        
        // 화면 일정 위치에 도달하면 좌우 움직임 시작
        this.time.addEvent({
            delay: 3000,
            callback: () => {
                if (boss.active && !this.gameState.gameOver) {
                    boss.setVelocityY(0);
                    
                    // 좌우 움직임 트윈
                    this.tweens.add({
                        targets: boss,
                        x: { from: 200, to: 600 },
                        ease: 'Sine.easeInOut',
                        duration: 3000,
                        repeat: -1,
                        yoyo: true
                    });
                    
                    // 보스 공격 패턴
                    this.bossAttackTimer = this.time.addEvent({
                        delay: 2000,
                        callback: () => {
                            if (boss.active && !this.gameState.gameOver) {
                                this.bossAttack(boss);
                            }
                        },
                        callbackScope: this,
                        loop: true
                    });
                }
            },
            callbackScope: this
        });
    }
    
    bossAttack(boss) {
        // 보스 공격 패턴 - 여러 방향으로 총알 발사
        const bulletCount = 8;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            const bullet = this.enemyBullets.create(boss.x, boss.y, 'bullet');
            
            bullet.setScale(1);
            bullet.setTint(0xff0000);
            
            // 방향에 따른 속도 계산
            const vx = Math.cos(angle) * CONSTANTS.ENEMY_BULLET_SPEED;
            const vy = Math.sin(angle) * CONSTANTS.ENEMY_BULLET_SPEED;
            
            bullet.setVelocity(vx, vy);
            
            // 화면 밖으로 나가면 제거
            bullet.checkWorldBounds = true;
            bullet.outOfBoundsKill = true;
        }
    }
    
    playerShoot() {
        if (!this.playerState.canFire || this.playerState.isLooping || this.gameState.gameOver) return;
        
        this.playerState.canFire = false;
        
        // 파워 레벨에 따른 총알 패턴
        switch (this.gameState.power) {
            case 1:
                // 단일 총알
                this.fireBullet(this.player.x, this.player.y - 20);
                break;
            
            case 2:
                // 이중 총알
                this.fireBullet(this.player.x - 15, this.player.y - 20);
                this.fireBullet(this.player.x + 15, this.player.y - 20);
                break;
            
            case 3:
                // 삼중 총알 (퍼짐)
                this.fireBullet(this.player.x, this.player.y - 25);
                this.fireBullet(this.player.x - 20, this.player.y - 15, -50);
                this.fireBullet(this.player.x + 20, this.player.y - 15, 50);
                break;
        }
        
        // 총알 발사 딜레이
        this.time.addEvent({
            delay: CONSTANTS.BULLET_FIRE_DELAY / this.gameState.power,
            callback: () => {
                this.playerState.canFire = true;
            },
            callbackScope: this
        });
    }
    
    fireBullet(x, y, vx = 0) {
        const bullet = this.playerBullets.create(x, y, 'bullet');
        bullet.setScale(0.5);
        bullet.setVelocity(vx, -CONSTANTS.BULLET_SPEED);
        
        // 화면 밖으로 나가면 제거
        bullet.checkWorldBounds = true;
        bullet.outOfBoundsKill = true;
    }
    
    enemyShoot(enemy) {
        if (!enemy.active || this.gameState.gameOver) return;
        
        const bullet = this.enemyBullets.create(enemy.x, enemy.y + 20, 'bullet');
        bullet.setScale(0.5);
        bullet.setTint(0xff0000);
        
        // 플레이어 방향으로 총알 발사
        const angle = Phaser.Math.Angle.Between(
            enemy.x, enemy.y,
            this.player.x, this.player.y
        );
        
        const vx = Math.cos(angle) * CONSTANTS.ENEMY_BULLET_SPEED;
        const vy = Math.sin(angle) * CONSTANTS.ENEMY_BULLET_SPEED;
        
        bullet.setVelocity(vx, vy);
        
        // 화면 밖으로 나가면 제거
        bullet.checkWorldBounds = true;
        bullet.outOfBoundsKill = true;
    }
    
    doLoop() {
        if (this.playerState.isLooping || this.gameState.loops <= 0 || this.gameState.gameOver) return;
        
        // 회피기동 사용
        this.gameState.loops--;
        this.updateUI();
        
        // 플레이어 상태 변경
        this.playerState.isLooping = true;
        this.playerState.isInvulnerable = true;
        
        // 회피기동 애니메이션
        this.tweens.add({
            targets: this.player,
            y: this.player.y - 150,
            angle: 360,
            duration: CONSTANTS.LOOP_DURATION,
            ease: 'Power1',
            yoyo: true,
            onComplete: () => {
                this.player.angle = 0;
                this.playerState.isLooping = false;
                
                // 회피기동 후 짧은 무적 시간
                this.time.addEvent({
                    delay: CONSTANTS.LOOP_INVULNERABILITY,
                    callback: () => {
                        this.playerState.isInvulnerable = false;
                    },
                    callbackScope: this
                });
            }
        });
        
        // 주변 적 제거
        this.clearEnemiesAroundPlayer();
    }
    
    clearEnemiesAroundPlayer() {
        const clearRadius = 150;
        
        // 적 그룹 순회하여 제거
        this.enemies.getChildren().forEach(enemy => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                enemy.x, enemy.y
            );
            
            if (distance < clearRadius) {
                // 폭발 효과
                const explosion = this.add.sprite(enemy.x, enemy.y, 'explosions');
                explosion.play('explode');
                explosion.once('animationcomplete', () => {
                    explosion.destroy();
                });
                
                // 점수 추가
                this.gameState.score += 50;
                enemy.destroy();
            }
        });
        
        // 적 총알 제거
        this.enemyBullets.getChildren().forEach(bullet => {
            const distance = Phaser.Math.Distance.Between(
                this.player.x, this.player.y,
                bullet.x, bullet.y
            );
            
            if (distance < clearRadius) {
                bullet.destroy();
            }
        });
        
        this.updateUI();
    }
    
    hitEnemy(bullet, enemy) {
        // 총알 제거
        bullet.destroy();
        
        // 적 체력 감소
        enemy.health = enemy.health - 1 || 0;
        
        if (enemy.health <= 0) {
            // 폭발 효과
            const explosion = this.add.sprite(enemy.x, enemy.y, 'explosions');
            explosion.play('explode');
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });
            
            // 보스인 경우 더 큰 점수와 파워업
            if (this.bosses.contains(enemy)) {
                this.gameState.score += CONSTANTS.BOSS_ENEMY_SCORE;
                this.gameState.level++;
                this.spawnPowerup(enemy.x, enemy.y);
                
                // 보스 공격 타이머 제거
                if (this.bossAttackTimer) {
                    this.bossAttackTimer.remove();
                }
            } else {
                this.gameState.score += CONSTANTS.BASIC_ENEMY_SCORE;
                
                // 일정 확률로 파워업 드랍
                if (Phaser.Math.Between(0, 100) < 10) {
                    this.spawnPowerup(enemy.x, enemy.y);
                }
            }
            
            enemy.destroy();
            this.updateUI();
        } else {
            // 피격 효과
            this.tweens.add({
                targets: enemy,
                alpha: 0.5,
                duration: 50,
                yoyo: true
            });
        }
    }
    
    hitPlayer(player, enemyOrBullet) {
        // 무적 상태인 경우 무시
        if (this.playerState.isInvulnerable || this.gameState.gameOver) {
            // 적 총알인 경우 제거
            if (this.enemyBullets.contains(enemyOrBullet)) {
                enemyOrBullet.destroy();
            }
            return;
        }
        
        // 적 총알인 경우 제거
        if (this.enemyBullets.contains(enemyOrBullet)) {
            enemyOrBullet.destroy();
        }
        
        // 생명 감소
        this.gameState.lives--;
        
        if (this.gameState.lives <= 0) {
            // 게임 오버
            this.gameState.gameOver = true;
            
            // 폭발 효과
            const explosion = this.add.sprite(player.x, player.y, 'explosions');
            explosion.setScale(2);
            explosion.play('explode');
            
            player.destroy();
            
            // 게임 오버 화면 표시
            this.time.addEvent({
                delay: 2000,
                callback: () => {
                    this.gameOver();
                },
                callbackScope: this
            });
        } else {
            // 일시적 무적 상태
            this.playerState.isInvulnerable = true;
            
            // 파워 레벨 감소
            this.gameState.power = Math.max(1, this.gameState.power - 1);
            
            // 깜빡임 효과
            this.tweens.add({
                targets: player,
                alpha: 0,
                duration: 100,
                repeat: 5,
                yoyo: true,
                onComplete: () => {
                    player.alpha = 1;
                    
                    // 무적 시간 후 상태 복귀
                    this.time.addEvent({
                        delay: CONSTANTS.HIT_INVULNERABILITY,
                        callback: () => {
                            this.playerState.isInvulnerable = false;
                        },
                        callbackScope: this
                    });
                }
            });
            
            this.updateUI();
        }
    }
    
    spawnPowerup(x, y) {
        const powerup = this.powerups.create(x, y, 'powerup');
        powerup.setScale(0.5);
        powerup.setVelocity(0, CONSTANTS.POWERUP_SPEED);
        
        // 반짝이는 효과
        this.tweens.add({
            targets: powerup,
            alpha: 0.5,
            duration: 300,
            yoyo: true,
            repeat: -1
        });
        
        // 화면 밖으로 나가면 제거
        powerup.checkWorldBounds = true;
        powerup.outOfBoundsKill = true;
    }
    
    collectPowerup(player, powerup) {
        // 파워 레벨 증가 (최대 3)
        this.gameState.power = Math.min(CONSTANTS.MAX_POWER_LEVEL, this.gameState.power + 1);
        
        // 일정 확률로 추가 회피기동
        if (Phaser.Math.Between(0, 100) < 30) {
            this.gameState.loops++;
        }
        
        powerup.destroy();
        this.updateUI();
    }
    
    gameOver() {
        // 게임 오버 화면 표시
        document.getElementById('game-over').style.display = 'flex';
        document.getElementById('final-score').textContent = `최종 점수: ${this.gameState.score}`;
        
        // 다시 시작 버튼 이벤트
        document.getElementById('restart-button').addEventListener('click', () => {
            document.getElementById('game-over').style.display = 'none';
            this.scene.restart();
        });
    }
    
    updateUI() {
        // UI 텍스트 업데이트
        this.scoreText.setText(`점수: ${this.gameState.score}`);
        this.livesText.setText(`생명: ${this.gameState.lives}`);
        this.loopsText.setText(`회피기동: ${this.gameState.loops}`);
        this.powerText.setText(`파워: ${this.gameState.power}`);
    }
    
    update() {
        if (this.gameState.gameOver) return;
        
        // 배경 스크롤
        this.background.tilePositionY -= CONSTANTS.SCROLL_SPEED;
        
        // 플레이어 입력 처리
        this.handlePlayerInput();
    }
    
    handlePlayerInput() {
        if (this.playerState.isLooping || !this.player.active) return;
        
        // 속도 초기화
        this.player.setVelocity(0);
        
        // 키보드 입력
        if (this.cursors.left.isDown || this.mobileInput?.left) {
            this.player.setVelocityX(-CONSTANTS.PLAYER_SPEED);
        } else if (this.cursors.right.isDown || this.mobileInput?.right) {
            this.player.setVelocityX(CONSTANTS.PLAYER_SPEED);
        }
        
        if (this.cursors.up.isDown || this.mobileInput?.up) {
            this.player.setVelocityY(-CONSTANTS.PLAYER_SPEED);
        } else if (this.cursors.down.isDown || this.mobileInput?.down) {
            this.player.setVelocityY(CONSTANTS.PLAYER_SPEED);
        }
        
        // 총알 발사
        if ((this.fireKey.isDown || this.mobileInput?.fire) && this.playerState.canFire) {
            this.playerShoot();
        }
        
        // 회피기동
        if (Phaser.Input.Keyboard.JustDown(this.loopKey)) {
            this.doLoop();
        }
    }
}

// Game Over Scene
class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }
    
    create() {
        // 게임 오버 씬은 HTML로 처리하므로 비어있음
    }
}

// 메인 게임 구성 (이제 모든 장면 클래스들이 정의된 후에 배치)
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-canvas',
    backgroundColor: '#000',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, PreloadScene, TitleScene, GameScene, GameOverScene],
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// DOM이 로드되면 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    // 게임 인스턴스 생성
    window.game = new Phaser.Game(config);
    
    // 재시작 버튼 이벤트
    document.getElementById('restart-button').addEventListener('click', () => {
        document.getElementById('game-over').style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
    });
});
