class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
        this.authModal = null;
        this.errorText = null;
        this.isRegisterMode = false;
    }

    preload() {
        this.load.image('btn_station', 'assets/btn_station.png');
        this.load.image('main_menu_foreground', 'assets/main_menu_foreground.png');
        this.load.image('rocket', 'assets/rocket.png');
    }

    async create() {
        const { width, height } = this.scale;
        this.cameras.main.setBackgroundColor('#1a1a2e');
        this.add.image(width/2, height/2, 'main_menu_foreground').setOrigin(0.5);
        
        // Add rocket near the right edge
        const rocket = this.add.image(width - 150, height - 400, 'rocket')
            .setScale(0.3) // Scale down the rocket to fit nicely
            .setOrigin(0.5)
            .setDepth(10); // Ensure it's above other elements

        // Auto-login if nickname is saved
        const savedNickname = localStorage.getItem('nickname');
        if (savedNickname) {
            const ref = window.firebaseDB.ref(`/players/${savedNickname}`);
            const snap = await ref.get();
            if (snap.exists()) {
                const data = snap.val();
                window.SHARED = data.data || {};
                window.SHARED.nickname = savedNickname;
                window.SHARED.anonymous = false;
                this.createMenuButtons();
                return;
            } else {
                // Clear invalid nickname
                localStorage.removeItem('nickname');
            }
        }

        // If already logged in, show normal menu
        if (window.SHARED && (window.SHARED.nickname || window.SHARED.anonymous)) {
            this.createMenuButtons();
            return;
        }

        // Otherwise, show only the Authorization button
        this.createAuthButton(width, height);
    }

    createAuthButton(width, height) {
        const authBtn = this.add.text(width/2, height/2 + 100, 'Authorization', {
            fontSize: '32px', color: '#fff', backgroundColor: '#4a90e2', padding: {x:40, y:16}, fontStyle: 'bold', borderRadius: '8px'
        }).setOrigin(0.5).setInteractive();
        authBtn.on('pointerdown', () => this.showAuthModal());
    }

    showAuthModal() {
        if (this.authModal) {
            this.authModal.setVisible(true);
            return;
        }
        const { width, height } = this.scale;
        this.authModal = this.add.container(width/2, height/2);
        const bg = this.add.rectangle(0, 0, 420, 340, 0x22223a, 0.98).setStrokeStyle(3, 0xffffff);
        const title = this.add.text(0, -140, 'Authorization', { fontSize: '32px', color: '#FFD700', fontStyle: 'bold' }).setOrigin(0.5);
        this.errorText = this.add.text(0, 120, '', { fontSize: '20px', color: '#ff6b6b', fontFamily: 'monospace' }).setOrigin(0.5);

        // Login fields
        this.nicknameInput = this.createInputField(-90, -60, 'Nickname');
        this.passwordInput = this.createInputField(-90, 0, 'Password', 'password');
        this.loginBtn = this.add.text(0, 60, 'Log In', { fontSize: '24px', color: '#fff', backgroundColor: '#4a90e2', padding: {x:30, y:10} })
            .setOrigin(0.5).setInteractive();
        this.loginBtn.on('pointerdown', () => this.handleLogin());

        // Register button
        this.registerBtn = this.add.text(0, 100, 'Register', { fontSize: '18px', color: '#fff', backgroundColor: '#333', padding: {x:18, y:6} })
            .setOrigin(0.5).setInteractive();
        this.registerBtn.on('pointerdown', () => this.showRegisterFields());

        // Registration fields (hidden by default)
        this.confirmInput = this.createInputField(-90, 40, 'Confirm Password', 'password');
        this.confirmInput.setVisible(false);
        this.registerSubmitBtn = this.add.text(0, 100, 'Create Account', { fontSize: '20px', color: '#fff', backgroundColor: '#4a90e2', padding: {x:22, y:8} })
            .setOrigin(0.5).setInteractive();
        this.registerSubmitBtn.setVisible(false);
        this.registerSubmitBtn.on('pointerdown', () => this.handleRegister());

        // Close button
        const closeBtn = this.add.text(180, -140, 'X', { fontSize: '24px', color: '#ff6b6b', backgroundColor: '#222', padding: {x:10, y:2} })
            .setOrigin(0.5).setInteractive();
        closeBtn.on('pointerdown', () => this.authModal.setVisible(false));

        this.authModal.add([
            bg, title, closeBtn, this.nicknameInput, this.passwordInput, this.loginBtn, this.registerBtn, this.confirmInput, this.registerSubmitBtn, this.errorText
        ]);
    }

    showRegisterFields() {
        this.isRegisterMode = true;
        this.confirmInput.setVisible(true);
        this.registerSubmitBtn.setVisible(true);
        this.loginBtn.setVisible(false);
        this.registerBtn.setVisible(false);
        this.errorText.setText('');
    }

    showLoginFields() {
        this.isRegisterMode = false;
        this.confirmInput.setVisible(false);
        this.registerSubmitBtn.setVisible(false);
        this.loginBtn.setVisible(true);
        this.registerBtn.setVisible(true);
        this.errorText.setText('');
    }

    createInputField(x, y, placeholder, type='text') {
        const input = this.add.dom(x, y, 'input', 'font-size:22px; padding:8px; border-radius:6px; width:220px;', '')
            .setOrigin(0, 0.5);
        input.node.type = type;
        input.node.placeholder = placeholder;
        return input;
    }

    async handleLogin() {
        this.errorText.setText('');
        const nickname = this.nicknameInput.node.value.trim();
        const password = this.passwordInput.node.value;
        if (!this.validateNickname(nickname)) return;
        if (!password) return this.showError('Enter your password.');
        const ref = window.firebaseDB.ref(`/players/${nickname}`);
        const snap = await ref.get();
        if (!snap.exists()) return this.showError('Nickname not found.');
        const data = snap.val();
        if (data.password !== password) return this.showError('Wrong password.');
        window.SHARED = data.data || {};
        window.SHARED.nickname = nickname;
        window.SHARED.anonymous = false;
        localStorage.setItem('nickname', nickname);
        this.authModal.setVisible(false);
        this.scene.restart();
    }

    async handleRegister() {
        this.errorText.setText('');
        const nickname = this.nicknameInput.node.value.trim();
        const password = this.passwordInput.node.value;
        const confirm = this.confirmInput.node.value;
        if (!this.validateNickname(nickname)) return;
        if (!password) return this.showError('Enter a password.');
        if (password !== confirm) return this.showError('Passwords do not match.');
        const ref = window.firebaseDB.ref(`/players/${nickname}`);
        const snap = await ref.get();
        if (snap.exists()) return this.showError('Nickname already taken.');
        await ref.set({
            password,
            data: window.SHARED,
            score: 0
        });
        window.SHARED.nickname = nickname;
        window.SHARED.anonymous = false;
        localStorage.setItem('nickname', nickname);
        this.authModal.setVisible(false);
        this.scene.restart();
    }

    validateNickname(nickname) {
        if (!nickname) {
            this.showError('Enter a nickname.');
            return false;
        }
        if (/[.#$\[\]]/.test(nickname)) {
            this.showError('Nickname cannot contain . # $ [ ]');
            return false;
        }
        if (nickname.length < 3) {
            this.showError('Nickname too short.');
            return false;
        }
        return true;
    }

    showError(msg) {
        this.errorText.setText(msg);
    }

    createMenuButtons() {
        // --- Primary Station Button (Centered Image) ---
        const stationBtn = this.add.image(this.scale.width / 2, this.scale.height * 0.5, 'btn_station')
            .setScale(0.32, 0.2) // Wider X scale for the primary button
            .setOrigin(0.5)
            .setInteractive();
        this.addHoverEffect(stationBtn, () => this.scene.start('Station'));

        // --- Secondary Buttons (Horizontal Text Row) ---
        const secondaryButtons = [
            { label: 'World Map', scene: 'WorldMap' },
            { label: 'Shop', scene: 'Shop' },
            { label: 'Ranking', scene: 'Ranking' },
            { label: 'Settings', scene: 'Settings' }
        ];

        const secondaryButtonStyle = {
            fontSize: '24px',
            color: '#ffffff',
            shadow: { color: '#000000', fill: true, blur: 5, offsetY: 2 }
        };

        const totalWidth = this.scale.width * 0.7;
        const startX = (this.scale.width / 2) - (totalWidth / 2);
        const yPos = this.scale.height * 0.75;
        const spacing = secondaryButtons.length > 1 ? totalWidth / (secondaryButtons.length - 1) : 0;

        secondaryButtons.forEach((btnInfo, i) => {
            const button = this.add.text(startX + i * spacing, yPos, btnInfo.label, secondaryButtonStyle)
                .setOrigin(0.5)
                .setInteractive();
            this.addHoverEffect(button, () => this.scene.start(btnInfo.scene));
        });
    }

    addHoverEffect(button, onClick) {
        const baseScale = button.scale;
        button.on('pointerover', () => {
            this.tweens.add({ targets: button, scale: baseScale * 1.1, duration: 100 });
        });
        button.on('pointerout', () => {
            this.tweens.add({ targets: button, scale: baseScale, duration: 100 });
        });
        button.on('pointerdown', onClick);
    }
}

window.MainMenu = MainMenu;