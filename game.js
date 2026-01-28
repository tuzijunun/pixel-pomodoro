// 全屏像素番茄钟游戏 - 增强版
let game;
let timerText;
let timeLeft = 25 * 60;
let isRunning = false;
let startButton;
let statusText;
let timeSetting = 25;
let isFullscreen = false;
let fullscreenBtn;
let backgroundImage;

// 新增变量：时间设置面板和拖动相关
let timeSettingsPanel;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let timerPosition = { x: 0, y: 0 };
let settingsVisible = true; // 开始时显示设置面板

// 获取浏览器窗口尺寸
function getWindowSize() {
    return {
        width: window.innerWidth,
        height: window.innerHeight
    };
}

// 游戏配置
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: getWindowSize().width,
    height: getWindowSize().height,
    backgroundColor: '#0c0c1a',
    scene: {
        preload: preload,
        create: create,
        update: update
    },
    render: {
        pixelArt: true
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// 初始化游戏
window.onload = function() {
    game = new Phaser.Game(config);
    
    // 窗口大小改变时重新调整
    window.addEventListener('resize', function() {
        if (game && game.scale) {
            game.scale.resize(window.innerWidth, window.innerHeight);
            if (backgroundImage) {
                backgroundImage.setDisplaySize(game.scale.width, game.scale.height);
            }
        }
    });
};

// 预加载资源
function preload() {
    console.log("加载资源中...");
    
    // 加载你的全屏背景图
    // this.load.image('room_bg', 'assets/rooms/room_background.png');
}

// 创建游戏场景
function create() {
    console.log("创建全屏游戏场景...");
    
    let centerX = this.cameras.main.centerX;
    let centerY = this.cameras.main.centerY;
    
    // ========== 1. 显示背景 ==========
    // 使用渐变色背景
    let graphics = this.add.graphics();
    graphics.fillGradientStyle(
        0x0c0c1a, 0x0c0c1a,
        0x1a1a2e, 0x1a1a2e,
        0x16213e, 0x16213e,
        0x0f3460, 0x0f3460
    );
    graphics.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
    graphics.setDepth(-100);
    
    // ========== 2. 创建时间设置面板（开始时显示） ==========
    timeSettingsPanel = this.add.container(centerX, centerY * 0.3);
    
    // 设置面板背景
    let panelBg = this.add.rectangle(0, 0, 350, 120, 0x1a1a2e, 0.8);
    panelBg.setStrokeStyle(2, 0x4fc3f7);
    timeSettingsPanel.add(panelBg);
    
    // 标题
    let settingsTitle = this.add.text(0, -40, '设置番茄时间', {
        fontSize: '22px',
        fill: '#4fc3f7',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    timeSettingsPanel.add(settingsTitle);
    
    // 减少时间按钮
    let minusBtn = this.add.rectangle(-80, 10, 50, 50, 0x607D8B);
    minusBtn.setInteractive({ useHandCursor: true });
    minusBtn.on('pointerdown', () => {
        if (timeSetting > 1 && !isRunning) {
            timeSetting--;
            timeLeft = timeSetting * 60;
            updateTimerDisplay();
            updateTimeDisplay();
        }
    });
    timeSettingsPanel.add(minusBtn);
    
    this.add.text(-80, 10, '-', {
        fontSize: '36px',
        fill: '#ffffff'
    }).setOrigin(0.5);
    timeSettingsPanel.add(this.add.text(-80, 10, '-', {
        fontSize: '36px',
        fill: '#ffffff'
    }).setOrigin(0.5));
    
    // 当前设置时间显示
    let timeDisplay = this.add.text(0, 10, timeSetting + ' 分钟', {
        fontSize: '28px',
        fill: '#FFD700',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold'
    }).setOrigin(0.5);
    timeSettingsPanel.add(timeDisplay);
    
    // 增加时间按钮
    let plusBtn = this.add.rectangle(80, 10, 50, 50, 0x607D8B);
    plusBtn.setInteractive({ useHandCursor: true });
    plusBtn.on('pointerdown', () => {
        if (timeSetting < 60 && !isRunning) {
            timeSetting++;
            timeLeft = timeSetting * 60;
            updateTimerDisplay();
            updateTimeDisplay();
        }
    });
    timeSettingsPanel.add(plusBtn);
    
    this.add.text(80, 10, '+', {
        fontSize: '36px',
        fill: '#ffffff'
    }).setOrigin(0.5);
    timeSettingsPanel.add(this.add.text(80, 10, '+', {
        fontSize: '36px',
        fill: '#ffffff'
    }).setOrigin(0.5));
    
    // 更新设置时间显示的函数
    function updateTimeDisplay() {
        timeDisplay.setText(timeSetting + ' 分钟');
    }
    
    // ========== 3. 创建倒计时显示（可拖动，调整大小） ==========
    // 设置默认位置（屏幕中心偏下）
    timerPosition.x = centerX;
    timerPosition.y = centerY * 1.2;
    
    timerText = this.add.text(timerPosition.x, timerPosition.y, formatTime(timeLeft), {
        fontSize: '80px', // 减小字体大小，确保完整显示
        fill: '#FFFFFF',
        fontFamily: '"Press Start 2P", Courier, monospace',
        fontWeight: 'bold',
        stroke: '#000000',
        strokeThickness: 6,
        shadow: {
            offsetX: 4,
            offsetY: 4,
            color: '#000000',
            blur: 0,
            fill: true
        }
    }).setOrigin(0.5);
    
    // 添加拖动提示文本（小字，半透明）
    let dragHint = this.add.text(timerPosition.x, timerPosition.y + 60, '↕ 可拖动', {
        fontSize: '14px',
        fill: '#888888',
        fontFamily: 'Arial, sans-serif',
        alpha: 0.6
    }).setOrigin(0.5);
    
    // 添加发光效果
    let timerGlow = this.add.graphics();
    timerGlow.fillStyle(0x4CAF50, 0.1);
    timerGlow.fillCircle(timerPosition.x, timerPosition.y, 80);
    timerGlow.setDepth(-1);
    
    // ========== 4. 使倒计时可拖动 ==========
    timerText.setInteractive({ draggable: true });
    
    // 拖动开始
    timerText.on('dragstart', function(pointer, dragX, dragY) {
        isDragging = true;
        dragOffset.x = timerText.x - pointer.x;
        dragOffset.y = timerText.y - pointer.y;
        timerText.setAlpha(0.8); // 拖动时半透明
        dragHint.setAlpha(0.8);
        timerGlow.setAlpha(0.8);
    });
    
    // 拖动中
    timerText.on('drag', function(pointer, dragX, dragY) {
        if (isDragging) {
            timerText.x = pointer.x + dragOffset.x;
            timerText.y = pointer.y + dragOffset.y;
            dragHint.x = timerText.x;
            dragHint.y = timerText.y + 60;
            timerGlow.x = timerText.x;
            timerGlow.y = timerText.y;
            
            // 更新位置记录
            timerPosition.x = timerText.x;
            timerPosition.y = timerText.y;
        }
    });
    
    // 拖动结束
    timerText.on('dragend', function() {
        isDragging = false;
        timerText.setAlpha(1);
        dragHint.setAlpha(0.6);
        timerGlow.setAlpha(1);
        console.log('倒计时位置已保存: (' + timerPosition.x + ', ' + timerPosition.y + ')');
    });
    
    // ========== 5. 创建控制按钮 ==========
    let buttonY = this.cameras.main.height - 100;
    
    // 开始/暂停按钮
    startButton = this.add.rectangle(centerX - 100, buttonY, 160, 60, 0x4CAF50);
    startButton.setInteractive({ useHandCursor: true });
    startButton.on('pointerover', function() {
        if (!isRunning) this.fillColor = 0x66BB6A;
    });
    startButton.on('pointerout', function() {
        this.fillColor = isRunning ? 0xF44336 : 0x4CAF50;
    });
    startButton.on('pointerdown', () => {
        if (timeLeft > 0) {
            isRunning = !isRunning;
            startButton.fillColor = isRunning ? 0xF44336 : 0x4CAF50;
            
            // 更新按钮文本
            this.children.list.forEach(child => {
                if (child.type === 'Text' && child.text === '开始') {
                    child.text = isRunning ? '暂停' : '开始';
                }
                if (child.type === 'Text' && child.text === '暂停') {
                    child.text = isRunning ? '暂停' : '开始';
                }
            });
            
            statusText.setText(isRunning ? '状态：专注中...' : '状态：已暂停');
            
            // 控制时间设置面板的显示/隐藏
            if (isRunning) {
                // 开始计时：隐藏设置面板
                hideSettingsPanel();
            } else {
                // 暂停：显示设置面板
                showSettingsPanel();
            }
        }
    });
    
    this.add.text(centerX - 100, buttonY, '开始', {
        fontSize: '24px',
        fill: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold'
    }).setOrigin(0.5);
    
    // 重置按钮
    let resetButton = this.add.rectangle(centerX + 100, buttonY, 160, 60, 0x607D8B);
    resetButton.setInteractive({ useHandCursor: true });
    resetButton.on('pointerover', function() {
        this.fillColor = 0x78909C;
    });
    resetButton.on('pointerout', function() {
        this.fillColor = 0x607D8B;
    });
    resetButton.on('pointerdown', () => {
        isRunning = false;
        timeLeft = timeSetting * 60;
        startButton.fillColor = 0x4CAF50;
        
        // 更新按钮文本
        this.children.list.forEach(child => {
            if (child.type === 'Text' && child.text === '暂停') {
                child.text = '开始';
            }
        });
        
        statusText.setText('状态：准备就绪');
        updateTimerDisplay();
        
        // 重置时显示设置面板
        showSettingsPanel();
    });
    
    this.add.text(centerX + 100, buttonY, '重置', {
        fontSize: '24px',
        fill: '#ffffff'
    }).setOrigin(0.5);
    
    // ========== 6. 全屏切换按钮 ==========
    fullscreenBtn = this.add.rectangle(this.cameras.main.width - 80, 40, 140, 40, 0x333333);
    fullscreenBtn.setInteractive({ useHandCursor: true });
    fullscreenBtn.on('pointerdown', toggleFullscreen);
    
    this.add.text(this.cameras.main.width - 80, 40, '进入全屏', {
        fontSize: '18px',
        fill: '#ffffff'
    }).setOrigin(0.5);
    
    // ========== 7. 状态显示 ==========
    statusText = this.add.text(centerX, this.cameras.main.height - 40, '状态：准备就绪', {
        fontSize: '18px',
        fill: '#b0b0d0',
        fontFamily: 'Arial, sans-serif'
    }).setOrigin(0.5);
    
    // ========== 8. 工具函数：显示/隐藏设置面板 ==========
    function hideSettingsPanel() {
        if (timeSettingsPanel && settingsVisible) {
            this.tweens.add({
                targets: timeSettingsPanel,
                alpha: 0,
                y: '-=50',
                duration: 300,
                ease: 'Power2',
                onComplete: function() {
                    timeSettingsPanel.setVisible(false);
                    settingsVisible = false;
                }
            });
        }
    }
    
    function showSettingsPanel() {
        if (timeSettingsPanel && !settingsVisible) {
            timeSettingsPanel.setVisible(true);
            this.tweens.add({
                targets: timeSettingsPanel,
                alpha: 1,
                y: centerY * 0.3,
                duration: 300,
                ease: 'Power2',
                onComplete: function() {
                    settingsVisible = true;
                }
            });
        }
    }
    
    // 将函数绑定到场景
    this.hideSettingsPanel = hideSettingsPanel.bind(this);
    this.showSettingsPanel = showSettingsPanel.bind(this);
    
    // ========== 9. 初始显示 ==========
    updateTimerDisplay();
    
    console.log("游戏场景创建完成");
}

// 游戏主循环
function update(time, delta) {
    if (!isRunning || timeLeft <= 0) return;
    
    timeLeft -= delta / 1000;
    
    if (timeLeft <= 0) {
        timeLeft = 0;
        isRunning = false;
        startButton.fillColor = 0x4CAF50;
        statusText.setText('状态：时间到！');
        
        // 番茄钟结束时显示设置面板
        if (game.scene.scenes[0].showSettingsPanel) {
            game.scene.scenes[0].showSettingsPanel();
        }
        
        // 更新按钮文本
        if (game && game.scene && game.scene.scenes[0]) {
            game.scene.scenes[0].children.list.forEach(child => {
                if (child.type === 'Text' && child.text === '暂停') {
                    child.text = '开始';
                }
            });
        }
        
        // 时间到的效果
        this.time.delayedCall(100, () => {
            let timeUpText = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.centerY * 0.5,
                '🎉 时间到！休息一下 🎉',
                {
                    fontSize: '36px',
                    fill: '#FF9800',
                    fontFamily: 'Arial, sans-serif',
                    fontWeight: 'bold',
                    stroke: '#000',
                    strokeThickness: 6
                }
            ).setOrigin(0.5);
            
            // 闪烁效果
            this.tweens.add({
                targets: timeUpText,
                alpha: 0.3,
                duration: 500,
                yoyo: true,
                repeat: 3,
                onComplete: function() {
                    timeUpText.destroy();
                }
            });
        }, [], this);
    }
    
    updateTimerDisplay();
}

// ========================
// 工具函数
// ========================

// 格式化时间
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// 更新计时器显示
function updateTimerDisplay() {
    timerText.setText(formatTime(timeLeft));
    
    // 闪烁效果
    if (timeLeft < 10 && timeLeft > 0 && isRunning) {
        timerText.setFill(Math.floor(timeLeft * 2) % 2 === 0 ? '#FF5252' : '#FFFFFF');
    } else {
        timerText.setFill('#FFFFFF');
    }
}

// 切换全屏
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log(`全屏请求失败: ${err.message}`);
        });
        isFullscreen = true;
        fullscreenBtn.fillColor = 0x555555;
        game.scale.resize(window.innerWidth, window.innerHeight);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            isFullscreen = false;
            fullscreenBtn.fillColor = 0x333333;
            game.scale.resize(window.innerWidth, window.innerHeight);
        }
    }
}

// 监听全屏变化
document.addEventListener('fullscreenchange', function() {
    isFullscreen = !!document.fullscreenElement;
    if (fullscreenBtn) {
        fullscreenBtn.fillColor = isFullscreen ? 0x555555 : 0x333333;
    }
    if (game && game.scale) {
        setTimeout(() => {
            game.scale.resize(window.innerWidth, window.innerHeight);
        }, 100);
    }
});