class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver');
    }
    init(data) {
        this.score = data.score || 0;
    }
    create() {
        this.add.image(400, 300, 'gameover_screen').setOrigin(0.5).setScale(0.75);
    
        const lives = window.SHARED.lives;
        const timerText = this.add.text(400, 520, '', { fontSize: 26, color: '#fff' }).setOrigin(0.5);
    
        if (lives <= 0) {
            const last = parseInt(localStorage.getItem('lastLifeLostAt') || "0");
            const now = Date.now();
            const delta = 20 * 60 * 1000; // 20 минут
            const remaining = delta - (now - last);
    
            if (remaining > 0) {
                this.timeLeft = remaining;
                this.timerEvent = this.time.addEvent({
                    delay: 1000,
                    loop: true,
                    callback: () => {
                        this.timeLeft -= 1000;
                        const min = Math.floor(this.timeLeft / 60000);
                        const sec = Math.floor((this.timeLeft % 60000) / 1000);
                        timerText.setText(`⏳ ${min}:${sec.toString().padStart(2, '0')}`);
    
                        if (this.timeLeft <= 0) {
                            window.SHARED.lives = 1;
                            localStorage.removeItem('lastLifeLostAt');
                            this.scene.start('Station');
                        }
                    }
                });
            } else {
                window.SHARED.lives = 1;
                localStorage.removeItem('lastLifeLostAt');
                this.scene.start('Station');
            }
        } else {
            this.add.text(400, 520, 'Нажми, чтобы попробовать снова', {
                fontSize: 24,
                color: '#fff',
                backgroundColor: '#333'
            }).setOrigin(0.5);
            this.input.once('pointerdown', () => this.scene.start('GameScene'));
        }
    }    
}