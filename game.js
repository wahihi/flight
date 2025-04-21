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

// Boot Scene - 초기 설정
class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }
    
    preload() {
        // 에셋 없이 바로 다음 씬으로 넘어감
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
    }
    
    create() {
        // 타이틀 씬으로 이동
        this.scene.start('TitleScene');
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
        
        // 색상 정의
        this.colors = {
            background: 0x0a1f44,
            player: 0x4080ff,
            enemy: 0xff4040,
            boss: 0xff00ff,
            bullet: 0xffff00,
            enemyBullet: 0xff0000,
            powerup: 0x00ffff,
            explosion: 0xffaa00,
            ui: 0xffffff
        };
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
        // 배경 그래픽 그리기
        const bg = this.add.graphics();
        bg.fillStyle(this.colors.background, 1);
        bg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        // 스크롤 효과를 위한 배경 변수
        this.scrollY = 0;
        
        // 배경에 별 만들기
        this.stars = [];
        for (let i = 0; i < 100; i++) {
            const x = Phaser.Math.Between(0, this.cameras.main.width);
            const y = Phaser.Math.Between(0, this.cameras.main.height);
            const size = Phaser.Math.Between(1, 3);
            const speed = Phaser.Math.Between(1, 3);
            
            const star = this.add.graphics();
            star.fillStyle(0xffffff, Phaser.Math.Between(5, 10) / 10);
            star.fillCircle(x, y, size);
            star.speed = speed;
            
            this.stars.push(star);
        }
    }
    
    createPlayer() {
        // 플레이어 스프라이트(그래픽으로 생성)
        this.player = this.add.graphics();
        this.player.fillStyle(this.colors.player, 1);
        this.drawPlayerShip(this.player, 0, 0);
        
        // 물리 처리를 위한 컨테이너 추가
        this.playerContainer = this.add.container(400, 500, [this.player]);
        this.physics.world.enable(this.playerContainer);
        this.playerContainer.body.setSize(30, 30);
        this.playerContainer.body.setCollideWorldBounds(true);
        
        // 플레이어 상태
        this.playerState = {
            isLooping: false,
            isInvulnerable: false,
            canFire: true,
            lastFired: 0
        };
    }
    
    // 플레이어 비행기 그리기
    drawPlayerShip(graphics, x, y) {
        // 비행기 모양 그리기
        graphics.clear();
        graphics.fillStyle(this.colors.player, 1);
        
        // 비행기 본체
        graphics.fillTriangle(
            x, y - 15,
            x - 10, y + 10,
            x + 10, y + 10
        );
        
        // 비행기 날개
        graphics.fillStyle(0x6090ff, 1);
        graphics.fillTriangle(
            x - 5, y,
            x - 20, y + 10,
            x - 5, y + 5
        );
        
        graphics.fillTriangle(
            x + 5, y,
            x + 20, y + 10,
            x + 5, y + 5
        );
        
        // 비행기 꼬리
        graphics.fillStyle(0x60a0ff, 1);
        graphics.fillRect(x - 2, y + 10, 4, 10);
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
        
        // 폭발 효과 그룹
        this.explosions = this.add.group();
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
        this.physics.add.collider(this.enemyBullets, this.playerContainer, this.hitPlayer, null, this);
        
        // 적과 플레이어 충돌
        this.physics.add.collider(this.enemies, this.playerContainer, this.hitPlayer, null, this);
        this.physics.add.collider(this.bosses, this.playerContainer, this.hitPlayer, null, this);
        
        // 파워업과 플레이어 충돌
        this.physics.add.overlap(this.playerContainer, this.powerups, this.collectPowerup, null, this);
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
            
            // 적 그래픽 생성
            const enemy = this.add.graphics();
            enemy.fillStyle(this.colors.enemy, 1);
            this.drawEnemyShip(enemy, 0, 0);
            
            // 물리 처리를 위한 컨테이너
            const enemyContainer = this.add.container(x, -50, [enemy]);
            this.physics.world.enable(enemyContainer);
            enemyContainer.body.setSize(25, 25);
            
            // 적 속성 설정
            enemyContainer.health = CONSTANTS.BASIC_ENEMY_HEALTH;
            
            // 레벨에 따른 속도 증가
            const speedMultiplier = 1 + (this.gameState.level * 0.1);
            enemyContainer.body.setVelocityY(CONSTANTS.BASIC_ENEMY_SPEED * speedMultiplier);
            
            // 좌우 움직임 추가
            if (Phaser.Math.Between(0, 1)) {
                enemyContainer.body.setVelocityX(Phaser.Math.Between(-50, 50));
            }
            
            // 화면 밖으로 나가면 제거
            enemyContainer.body.onWorldBounds = true;
            enemyContainer.body.world.on('worldbounds', (body) => {
                if (body.gameObject === enemyContainer) {
                    enemyContainer.destroy();
                }
            });
            
            // 적 그룹에 추가
            this.enemies.add(enemyContainer);
            
            // 랜덤하게 총알 발사
            if (Phaser.Math.Between(0, 100) < 30) {
                this.time.addEvent({
                    delay: Phaser.Math.Between(1000, 3000),
                    callback: () => {
                        if (enemyContainer.active && !this.gameState.gameOver) {
                            this.enemyShoot(enemyContainer);
                        }
                    },
                    callbackScope: this
                });
            }
        }
    }
    
    // 적 비행기 그리기
    drawEnemyShip(graphics, x, y) {
        graphics.clear();
        
        // 적 비행기 본체
        graphics.fillTriangle(
            x, y + 15,
            x - 10, y - 10,
            x + 10, y - 10
        );
        
        // 적 비행기 날개
        graphics.fillTriangle(
            x - 5, y,
            x - 15, y - 10,
            x - 5, y - 5
        );
        
        graphics.fillTriangle(
            x + 5, y,
            x + 15, y - 10,
            x + 5, y - 5
        );
    }
    
    spawnBoss() {
        if (this.gameState.gameOver || this.bosses.getLength() > 0 || this.gameState.level < 3) return;
        
        // 보스 그래픽 생성
        const boss = this.add.graphics();
        boss.fillStyle(this.colors.boss, 1);
        this.drawBossShip(boss, 0, 0);
        
        // 보스 컨테이너
        const bossContainer = this.add.container(400, -100, [boss]);
        this.physics.world.enable(bossContainer);
        bossContainer.body.setSize(60, 60);
        
        // 보스 속성 설정
        bossContainer.health = CONSTANTS.BOSS_ENEMY_HEALTH + (this.gameState.level * 5);
        
        // 보스 움직임
        bossContainer.body.setVelocityY(CONSTANTS.BOSS_ENEMY_SPEED);
        
        // 보스 그룹에 추가
        this.bosses.add(bossContainer);
        
        // 화면 일정 위치에 도달하면 좌우 움직임 시작
        this.time.addEvent({
            delay: 3000,
            callback: () => {
                if (bossContainer.active && !this.gameState.gameOver) {
                    bossContainer.body.setVelocityY(0);
                    
                    // 좌우 움직임 트윈
                    this.tweens.add({
                        targets: bossContainer,
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
                            if (bossContainer.active && !this.gameState.gameOver) {
                                this.bossAttack(bossContainer);
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
    
    // 보스 비행기 그리기
    drawBossShip(graphics, x, y) {
        graphics.clear();
        
        // 보스 몸체 (큰 육각형)
        graphics.fillStyle(this.colors.boss, 1);
        
        // 육각형 그리기
        const size = 30;
        const points = [];
        
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3) - Math.PI / 2;
            const px = x + size * Math.cos(angle);
            const py = y + size * Math.sin(angle);
            points.push({ x: px, y: py });
        }
        
        graphics.fillPoints(points, true, true);
        
        // 보스 무기
        graphics.fillStyle(0xaa00aa, 1);
        graphics.fillCircle(x - 15, y, 8);
        graphics.fillCircle(x + 15, y, 8);
        graphics.fillRect(x - 5, y + 15, 10, 15);
    }
    
    bossAttack(bossContainer) {
        // 보스 공격 패턴 - 여러 방향으로 총알 발사
        const bulletCount = 8;
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = (i / bulletCount) * Math.PI * 2;
            
            // 총알 그래픽 생성
            const bulletGraphic = this.add.graphics();
            bulletGraphic.fillStyle(this.colors.enemyBullet, 1);
            bulletGraphic.fillCircle(0, 0, 5);
            
            // 총알 컨테이너
            const bullet = this.add.container(bossContainer.x, bossContainer.y, [bulletGraphic]);
            this.physics.world.enable(bullet);
            bullet.body.setCircle(5);
            
            // 방향에 따른 속도 계산
            const vx = Math.cos(angle) * CONSTANTS.ENEMY_BULLET_SPEED;
            const vy = Math.sin(angle) * CONSTANTS.ENEMY_BULLET_SPEED;
            
            bullet.body.setVelocity(vx, vy);
            
            // 화면 밖으로 나가면 제거
            bullet.body.onWorldBounds = true;
            bullet.body.world.on('worldbounds', (body) => {
                if (body.gameObject === bullet) {
                    bullet.destroy();
                }
            });
            
            // 적 총알 그룹에 추가
            this.enemyBullets.add(bullet);
        }
    }
    
    playerShoot() {
        if (!this.playerState.canFire || this.playerState.isLooping || this.gameState.gameOver) return;
        
        this.playerState.canFire = false;
        
        // 파워 레벨에 따른 총알 패턴
        switch (this.gameState.power) {
            case 1:
                // 단일 총알
                this.fireBullet(this.playerContainer.x, this.playerContainer.y - 20);
                break;
            
            case 2:
                // 이중 총알
                this.fireBullet(this.playerContainer.x - 15, this.playerContainer.y - 15);
                this.fireBullet(this.playerContainer.x + 15, this.playerContainer.y - 15);
                break;
            
            case 3:
                // 삼중 총알 (퍼짐)
                this.fireBullet(this.playerContainer.x, this.playerContainer.y - 25);
                this.fireBullet(this.playerContainer.x - 20, this.playerContainer.y - 15, -50);
                this.fireBullet(this.playerContainer.x + 20, this.playerContainer.y - 15, 50);
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
        // 총알 그래픽 생성
        const bulletGraphic = this.add.graphics();
        bulletGraphic.fillStyle(this.colors.bullet, 1);
        bulletGraphic.fillCircle(0, 0, 4);
        
        // 총알 컨테이너
        const bullet = this.add.container(x, y, [bulletGraphic]);
        this.physics.world.enable(bullet);
        bullet.body.setCircle(4);
        
        bullet.body.setVelocity(vx, -CONSTANTS.BULLET_SPEED);
        
        // 화면 밖으로 나가면 제거
        bullet.body.onWorldBounds = true;
        bullet.body.world.on('worldbounds', (body) => {
            if (body.gameObject === bullet) {
                bullet.destroy();
            }
        });
        
        // 플레이어 총알 그룹에 추가
        this.playerBullets.add(bullet);
    }
    
    enemyShoot(enemyContainer) {
        if (!enemyContainer.active || this.gameState.gameOver) return;
        
        // 총알 그래픽 생성
        const bulletGraphic = this.add.graphics();
        bulletGraphic.fillStyle(this.colors.enemyBullet, 1);
        bulletGraphic.fillCircle(0, 0, 4);
        
        // 총알 컨테이너
        const bullet = this.add.container(enemyContainer.x, enemyContainer.y + 20, [bulletGraphic]);
        this.physics.world.enable(bullet);
        bullet.body.setCircle(4);
        
        // 플레이어 방향으로 총알 발사
        const angle = Phaser.Math.Angle.Between(
            enemyContainer.x, enemyContainer.y,
            this.playerContainer.x, this.playerContainer.y
        );
        
        const vx = Math.cos(angle) * CONSTANTS.ENEMY_BULLET_SPEED;
        const vy = Math.sin(angle) * CONSTANTS.ENEMY_BULLET_SPEED;
        
        bullet.body.setVelocity(vx, vy);
        
        // 화면 밖으로 나가면 제거
        bullet.body.onWorldBounds = true;
        bullet.body.world.on('worldbounds', (body) => {
            if (body.gameObject === bullet) {
                bullet.destroy();
            }
        });
        
        // 적 총알 그룹에 추가
        this.enemyBullets.add(bullet);
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
            targets: this.playerContainer,
            y: this.playerContainer.y - 150,
            angle: 360,
            duration: CONSTANTS.LOOP_DURATION,
            ease: 'Power1',
            yoyo: true,
            onComplete: () => {
                this.playerContainer.angle = 0;
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
                this.playerContainer.x, this.playerContainer.y,
                enemy.x, enemy.y
            );
            
            if (distance < clearRadius) {
                // 폭발 효과
                this.createExplosion(enemy.x, enemy.y);
                
                // 점수 추가
                this.gameState.score += 50;
                enemy.destroy();
            }
        });
        
        // 적 총알 제거
        this.enemyBullets.getChildren().forEach(bullet => {
            const distance = Phaser.Math.Distance.Between(
                this.playerContainer.x, this.playerContainer.y,
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
        enemy.health--;
        
        if (enemy.health <= 0) {
            // 폭발 효과
            this.createExplosion(enemy.x, enemy.y);
            
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
    
    createExplosion(x, y, scale = 1) {
        // 폭발 효과 그래픽 생성
        const explosion = this.add.graphics();
        explosion.fillStyle(this.colors.explosion, 1);
        
        // 폭발 애니메이션 (크기가 변하는 원)
        let size = 5;
        const maxSize = 30 * scale;
        
        // 타이머로 폭발 애니메이션 구현
        const expandTimer = this.time.addEvent({
            delay: 50,
            callback: () => {
                explosion.clear();
                explosion.fillStyle(this.colors.explosion, 1 - (size / maxSize));
                explosion.fillCircle(x, y, size);
                size += 5;
                
                if (size > maxSize) {
                    expandTimer.remove();
                    explosion.destroy();
                }
            },
            callbackScope: this,
            repeat: 6
        });
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
            this.createExplosion(this.playerContainer.x, this.playerContainer.y, 2);
            
            this.playerContainer.destroy();
            
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
                targets: this.playerContainer,
                alpha: 0,
                duration: 100,
                repeat: 5,
                yoyo: true,
                onComplete: () => {
                    this.playerContainer.alpha = 1;
                    
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
        // 파워업 그래픽 생성
        const powerupGraphic = this.add.graphics();
        powerupGraphic.fillStyle(this.colors.powerup, 1);
        powerupGraphic.fillCircle(0, 0, 10);
        powerupGraphic.fillStyle(0xffffff, 1);
        powerupGraphic.fillText('P', -3, 3, { font: '12px Arial' });
        
        // 파워업 컨테이너
        const powerup = this.add.container(x, y, [powerupGraphic]);
        this.physics.world.enable(powerup);
        powerup.body.setCircle(10);
        
        powerup.body.setVelocity(0, CONSTANTS.POWERUP_SPEED);
        
        // 반짝이는 효과
        this.tweens.add({
            targets: powerup,
            alpha: 0.5,
            duration: 300,
            yoyo: true,
            repeat: -1
        });
        
        // 화면 밖으로 나가면 제거
        powerup.body.onWorldBounds = true;
        powerup.body.world.on('worldbounds', (body) => {
            if (body.gameObject === powerup) {
                powerup.destroy();
            }
        });
        
        // 파워업 그룹에 추가
        this.powerups.add(powerup);
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
        
        // 배경 별 스크롤
        this.scrollY += CONSTANTS.SCROLL_SPEED;
        this.stars.forEach(star => {
            star.y += star.speed;
            if (star.y > this.cameras.main.height) {
                star.y = 0;
            }
        });
        
        // 플레이어 입력 처리
        this.handlePlayerInput();
    }
    
    handlePlayerInput() {
        if (this.playerState.isLooping || !this.playerContainer.active) return;
        
        // 속도 초기화
        this.playerContainer.body.setVelocity(0);
        
        // 키보드 입력
        if (this.cursors.left.isDown || this.mobileInput?.left) {
            this.playerContainer.body.setVelocityX(-CONSTANTS.PLAYER_SPEED);
        } else if (this.cursors.right.isDown || this.mobileInput?.right) {
            this.playerContainer.body.setVelocityX(CONSTANTS.PLAYER_SPEED);
        }
        
        if (this.cursors.up.isDown || this.mobileInput?.up) {
            this.playerContainer.body.setVelocityY(-CONSTANTS.PLAYER_SPEED);
        } else if (this.cursors.down.isDown || this.mobileInput?.down) {
            this.playerContainer.body.setVelocityY(CONSTANTS.PLAYER_SPEED);
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
