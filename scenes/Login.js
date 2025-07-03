class Login extends Phaser.Scene {
    constructor() {
        super('Login');
        this.errorText = null;
    }

    preload() {}

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(width/2, height/2, width, height, 0x1a1a2e);

        // Title
        this.add.text(width/2, 80, 'Cat Colony: Mars', {
            fontSize: '48px', color: '#FFD700', fontFamily: 'monospace', fontStyle: 'bold'
        }).setOrigin(0.5);

        // Tabs/buttons
        const loginBtn = this.add.text(width/2-180, 160, 'Log In', { fontSize: '28px', color: '#fff', backgroundColor: '#333', padding: {x:20, y:10} })
            .setOrigin(0.5).setInteractive();
        const registerBtn = this.add.text(width/2, 160, 'Register', { fontSize: '28px', color: '#fff', backgroundColor: '#333', padding: {x:20, y:10} })
            .setOrigin(0.5).setInteractive();
        const anonBtn = this.add.text(width/2+180, 160, 'Continue without login', { fontSize: '20px', color: '#fff', backgroundColor: '#333', padding: {x:20, y:10} })
            .setOrigin(0.5).setInteractive();

        // Panels
        this.loginPanel = this.createLoginPanel(width/2, 260);
        this.registerPanel = this.createRegisterPanel(width/2, 260);
        this.loginPanel.setVisible(true);
        this.registerPanel.setVisible(false);

        loginBtn.on('pointerdown', () => {
            this.loginPanel.setVisible(true);
            this.registerPanel.setVisible(false);
            this.clearError();
        });
        registerBtn.on('pointerdown', () => {
            this.loginPanel.setVisible(false);
            this.registerPanel.setVisible(true);
            this.clearError();
        });
        anonBtn.on('pointerdown', () => {
            window.SHARED.anonymous = true;
            this.scene.start('MainMenu');
        });

        // Error text
        this.errorText = this.add.text(width/2, height-80, '', {
            fontSize: '22px', color: '#ff6b6b', fontFamily: 'monospace'
        }).setOrigin(0.5);
    }

    createLoginPanel(x, y) {
        const panel = this.add.container(x, y);

        const nicknameInput = this.createInputField(-100, 0, 'Nickname');
        const passwordInput = this.createInputField(-100, 60, 'Password', 'password');
        const loginBtn = this.add.text(0, 120, 'Log In', { fontSize: '24px', color: '#fff', backgroundColor: '#4a90e2', padding: {x:30, y:10} })
            .setOrigin(0.5).setInteractive();

        loginBtn.on('pointerdown', async () => {
            this.clearError();
            const nickname = nicknameInput.node.value.trim();
            const password = passwordInput.node.value;
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
            this.scene.start('MainMenu');
        });

        panel.add([nicknameInput, passwordInput, loginBtn]);
        return panel;
    }

    createRegisterPanel(x, y) {
        const panel = this.add.container(x, y);

        const nicknameInput = this.createInputField(-100, 0, 'Nickname');
        const passwordInput = this.createInputField(-100, 60, 'Password', 'password');
        const confirmInput = this.createInputField(-100, 120, 'Confirm Password', 'password');
        const registerBtn = this.add.text(0, 180, 'Register', { fontSize: '24px', color: '#fff', backgroundColor: '#4a90e2', padding: {x:30, y:10} })
            .setOrigin(0.5).setInteractive();

        registerBtn.on('pointerdown', async () => {
            this.clearError();
            const nickname = nicknameInput.node.value.trim();
            const password = passwordInput.node.value;
            const confirm = confirmInput.node.value;
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
            this.scene.start('MainMenu');
        });

        panel.add([nicknameInput, passwordInput, confirmInput, registerBtn]);
        return panel;
    }

    createInputField(x, y, placeholder, type='text') {
        const input = this.add.dom(x, y, 'input', 'font-size:22px; padding:8px; border-radius:6px; width:220px;', '')
            .setOrigin(0, 0.5);
        input.node.type = type;
        input.node.placeholder = placeholder;
        return input;
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
    clearError() {
        this.errorText.setText('');
    }
}

window.Login = Login; 