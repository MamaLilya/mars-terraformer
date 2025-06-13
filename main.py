import pygame
import sys
import random
import time
import math
import os

# Initialize Pygame
pygame.init()

# Constants
WINDOW_WIDTH = 800
WINDOW_HEIGHT = 600
FPS = 60

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
BLUE = (0, 0, 255)
YELLOW = (255, 255, 0)
GRAY = (128, 128, 128)
BROWN = (139, 69, 19)  # For stones
LIGHT_BLUE = (173, 216, 230)  # For ice
ORANGE = (255, 165, 0)  # For energy

# Game states
MENU = "menu"
WORLD_MAP = "world_map"
STATION = "station"
GAME = "game"

# Player properties
PLAYER_WIDTH = 40
PLAYER_HEIGHT = 60
PLAYER_X = 100  # Fixed X position for player
JUMP_FORCE = -15
GRAVITY = 0.8

# Platform properties
BASE_PLATFORM_SPEED = 2  # Base speed for level 1
PLATFORM_WIDTH = 200
PLATFORM_HEIGHT = 20

# Collectible properties
COLLECTIBLE_SIZE = 20
COLLECTIBLE_TYPES = {
    'stone': {'color': BROWN, 'value': 1, 'chance': 0.4},
    'ice': {'color': LIGHT_BLUE, 'value': 1, 'chance': 0.3},
    'energy': {'color': ORANGE, 'value': 1, 'chance': 0.3}
}

# Button properties
BUTTON_WIDTH = 200
BUTTON_HEIGHT = 50
BUTTON_COLOR = GREEN
BUTTON_HOVER_COLOR = (0, 200, 0)

# Calculate maximum jump distance
def calculate_max_jump_distance():
    # Using physics equations for projectile motion
    # Time to reach peak of jump
    time_to_peak = abs(JUMP_FORCE) / GRAVITY
    # Total time in air (up and down)
    total_time = time_to_peak * 2
    # Maximum horizontal distance (assuming player moves at platform speed)
    return BASE_PLATFORM_SPEED * total_time

MAX_JUMP_DISTANCE = calculate_max_jump_distance()

# Load Station background image (global, so it's loaded once)
STATION_BG_PATH = os.path.join('assets', 'Background1.png')
station_bg_img = pygame.image.load(STATION_BG_PATH)
station_bg_img = pygame.transform.scale(station_bg_img, (WINDOW_WIDTH, WINDOW_HEIGHT))

class Button:
    def __init__(self, x, y, width, height, text, color, hover_color):
        self.rect = pygame.Rect(x, y, width, height)
        self.text = text
        self.color = color
        self.hover_color = hover_color
        self.is_hovered = False

    def draw(self, surface, font_override=None):
        color = self.hover_color if self.is_hovered else self.color
        pygame.draw.rect(surface, color, self.rect)
        pygame.draw.rect(surface, WHITE, self.rect, 2)  # Border
        font_to_use = font_override if font_override else font
        text_surface = font_to_use.render(self.text, True, WHITE)
        text_rect = text_surface.get_rect(center=self.rect.center)
        surface.blit(text_surface, text_rect)

    def handle_event(self, event):
        if event.type == pygame.MOUSEMOTION:
            self.is_hovered = self.rect.collidepoint(event.pos)
        elif event.type == pygame.MOUSEBUTTONDOWN:
            if self.is_hovered:
                return True
        return False

class Player(pygame.sprite.Sprite):
    def __init__(self, x, y):
        super().__init__()
        self.image = pygame.Surface((PLAYER_WIDTH, PLAYER_HEIGHT))
        self.image.fill(RED)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.velocity_y = 0
        self.jumping = False
        self.on_platform = False
        self.start_platform = None
        self.last_platform = None  # Track the last platform we were on
        self.last_jump_time = 0
        self.double_jump_available = False
        self.DOUBLE_JUMP_WINDOW = 0.3  # Time window for double jump in seconds

    def update(self, platforms, game_started):
        if not game_started:
            # Keep player on start platform
            if self.start_platform:
                self.rect.bottom = self.start_platform.rect.top
                self.velocity_y = 0
                self.jumping = False
                self.on_platform = True
                self.last_platform = self.start_platform
                self.double_jump_available = False
            return False

        # Apply gravity
        self.velocity_y += GRAVITY
        self.rect.y += self.velocity_y

        # Reset on_platform flag
        self.on_platform = False

        # Check for collisions with platforms
        for platform in platforms:
            if self.rect.colliderect(platform.rect):
                if self.velocity_y > 0:  # Falling
                    self.rect.bottom = platform.rect.top
                    self.velocity_y = 0
                    self.jumping = False
                    self.on_platform = True
                    self.double_jump_available = False
                    # If we landed on a new platform, increment the platform counter
                    if platform != self.last_platform:
                        self.last_platform = platform
                        return "new_platform"
                elif self.velocity_y < 0:  # Jumping
                    self.rect.top = platform.rect.bottom
                    self.velocity_y = 0

        # Game over if player falls below screen
        if self.rect.top > WINDOW_HEIGHT:
            return True
        return False

    def jump(self):
        current_time = time.time()
        
        if not self.jumping and self.on_platform:
            # First jump
            self.velocity_y = JUMP_FORCE
            self.jumping = True
            self.last_jump_time = current_time
            self.double_jump_available = True
        elif self.double_jump_available and current_time - self.last_jump_time < self.DOUBLE_JUMP_WINDOW:
            # Double jump
            self.velocity_y = JUMP_FORCE * 1.5  # 50% stronger jump
            self.double_jump_available = False
            # Add a small horizontal boost for the double jump
            self.rect.x += 20  # Small boost to the right

class Platform(pygame.sprite.Sprite):
    def __init__(self, x, y, width, height):
        super().__init__()
        self.image = pygame.Surface((width, height))
        self.image.fill(GREEN)
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y
        self.has_collectible = random.random() < 0.7  # 70% chance for a platform to have a collectible
        self.collectible_type = self.choose_collectible_type() if self.has_collectible else None

    def choose_collectible_type(self):
        rand = random.random()
        cumulative = 0
        for collectible_type, properties in COLLECTIBLE_TYPES.items():
            cumulative += properties['chance']
            if rand <= cumulative:
                return collectible_type
        return 'stone'  # Default fallback

    def update(self, game_started, platform_speed):
        if game_started:
            self.rect.x -= platform_speed
            if self.rect.right < 0:
                self.kill()

class Collectible(pygame.sprite.Sprite):
    def __init__(self, x, y, collectible_type):
        super().__init__()
        self.collectible_type = collectible_type
        self.image = pygame.Surface((COLLECTIBLE_SIZE, COLLECTIBLE_SIZE))
        self.image.fill(COLLECTIBLE_TYPES[collectible_type]['color'])
        self.rect = self.image.get_rect()
        self.rect.x = x
        self.rect.y = y - COLLECTIBLE_SIZE - 5  # Position above platform

    def update(self, game_started, platform_speed):
        if game_started:
            self.rect.x -= platform_speed
            if self.rect.right < 0:
                self.kill()

def get_level_settings(level):
    # Increase difficulty with each level
    speed_multiplier = 1 + (level - 1) * 0.2  # 20% increase per level
    gap_multiplier = 1 + (level - 1) * 0.1    # 10% increase per level
    
    platform_speed = BASE_PLATFORM_SPEED * speed_multiplier
    max_gap = MAX_JUMP_DISTANCE * gap_multiplier
    min_gap = max_gap * 0.7  # Minimum gap is 70% of max gap
    
    return platform_speed, min_gap, max_gap

def create_platform(is_first=False, level=1):
    last_platform = platforms.sprites()[-1] if platforms else None
    platform_speed, min_gap, max_gap = get_level_settings(level)
    
    if last_platform:
        x = last_platform.rect.right + random.randint(int(min_gap), int(max_gap))
    else:
        x = WINDOW_WIDTH
    if is_first:
        y = WINDOW_HEIGHT - 100  # Fixed height for first platform
    else:
        y = random.randint(WINDOW_HEIGHT - 200, WINDOW_HEIGHT - 100)
    platform = Platform(x, y, PLATFORM_WIDTH, PLATFORM_HEIGHT)
    platforms.add(platform)
    all_sprites.add(platform)
    
    if platform.has_collectible:
        collectible = Collectible(platform.rect.x + PLATFORM_WIDTH // 2, platform.rect.y, platform.collectible_type)
        collectibles.add(collectible)
        all_sprites.add(collectible)
    
    return platform

def reset_game(reset_lives=False, level_param=None):
    global player, platforms, collectibles, all_sprites, score, game_started, level, resources, lives
    # Clear all sprites
    all_sprites.empty()
    platforms.empty()
    collectibles.empty()
    # Reset score and game state
    score = 0
    resources = {'stone': 0, 'ice': 0, 'energy': 0}
    game_started = False
    if level_param is not None:
        level = level_param
    else:
        level = 1
    if reset_lives:
        lives = 3
    # Create first platform at player's position
    first_platform = create_platform(is_first=True, level=level)
    first_platform.rect.x = PLAYER_X - PLATFORM_WIDTH // 2  # Center platform under player
    # Create additional platforms
    for _ in range(4):  # Create 4 more platforms (5 total)
        create_platform(level=level)
    # Create player on the first platform
    player = Player(PLAYER_X, first_platform.rect.y - PLAYER_HEIGHT)
    player.start_platform = first_platform
    all_sprites.add(player)

class MainMenu:
    def __init__(self):
        self.buttons = []
        self.setup_buttons()

    def setup_buttons(self):
        # World Map button
        world_map_button = Button(
            WINDOW_WIDTH // 2 - BUTTON_WIDTH // 2,
            WINDOW_HEIGHT // 2 - BUTTON_HEIGHT - 20,
            BUTTON_WIDTH,
            BUTTON_HEIGHT,
            "World Map",
            BUTTON_COLOR,
            BUTTON_HOVER_COLOR
        )
        
        # Station button
        station_button = Button(
            WINDOW_WIDTH // 2 - BUTTON_WIDTH // 2,
            WINDOW_HEIGHT // 2 + 20,
            BUTTON_WIDTH,
            BUTTON_HEIGHT,
            "Station",
            BUTTON_COLOR,
            BUTTON_HOVER_COLOR
        )
        
        self.buttons = [world_map_button, station_button]

    def draw(self, surface):
        # Draw title
        title_text = font.render("Mars Terraformation", True, WHITE)
        title_rect = title_text.get_rect(center=(WINDOW_WIDTH/2, WINDOW_HEIGHT/4))
        surface.blit(title_text, title_rect)
        
        # Draw buttons
        for button in self.buttons:
            button.draw(surface)

    def handle_event(self, event):
        for i, button in enumerate(self.buttons):
            if button.handle_event(event):
                if i == 0:  # World Map button
                    return WORLD_MAP
                elif i == 1:  # Station button
                    return STATION
        return MENU

class Station:
    def __init__(self):
        self.back_button = Button(
            20, 20,
            BUTTON_WIDTH,
            BUTTON_HEIGHT,
            "Back to Menu",
            BUTTON_COLOR,
            BUTTON_HOVER_COLOR
        )
        self.start_button = Button(
            WINDOW_WIDTH // 2 - BUTTON_WIDTH // 2,
            WINDOW_HEIGHT - 100,
            BUTTON_WIDTH,
            BUTTON_HEIGHT,
            "Start Level",
            BUTTON_COLOR,
            BUTTON_HOVER_COLOR
        )
        # Farm grid properties (10% smaller)
        self.grid_size = int(70 * 0.9)  # 63
        self.grid_width = 15
        self.grid_height = 12
        self.offset_x = WINDOW_WIDTH // 4
        self.offset_y = WINDOW_HEIGHT // 4
        self.buildings = []
        # Small font for build buttons
        self.button_font = pygame.font.Font(None, 24)

    def draw_grid(self, surface):
        # Draw isometric grid
        for row in range(self.grid_height):
            for col in range(self.grid_width):
                # Calculate isometric position
                iso_x = self.offset_x + (col - row) * (self.grid_size // 2)
                iso_y = self.offset_y + (col + row) * (self.grid_size // 4)
                
                # Draw grid cell
                points = [
                    (iso_x, iso_y),  # Top
                    (iso_x + self.grid_size // 2, iso_y + self.grid_size // 4),  # Right
                    (iso_x, iso_y + self.grid_size // 2),  # Bottom
                    (iso_x - self.grid_size // 2, iso_y + self.grid_size // 4)  # Left
                ]
                pygame.draw.polygon(surface, (50, 50, 50), points, 1)

    def draw_building(self, surface, building_type, row, col):
        # Calculate isometric position
        iso_x = self.offset_x + (col - row) * (self.grid_size // 2)
        iso_y = self.offset_y + (col + row) * (self.grid_size // 4)
        
        # Draw building base
        base_points = [
            (iso_x, iso_y),  # Top
            (iso_x + self.grid_size // 2, iso_y + self.grid_size // 4),  # Right
            (iso_x, iso_y + self.grid_size // 2),  # Bottom
            (iso_x - self.grid_size // 2, iso_y + self.grid_size // 4)  # Left
        ]
        
        # Different colors for different building types
        if building_type == "farm":
            color = (34, 139, 34)  # Green for farms
        elif building_type == "greenhouse":
            color = (144, 238, 144)  # Light green for greenhouses
        else:
            color = (139, 69, 19)  # Brown for other buildings
        
        pygame.draw.polygon(surface, color, base_points)
        pygame.draw.polygon(surface, (100, 100, 100), base_points, 1)
        
        # Draw building top (3D effect)
        top_points = [
            (iso_x, iso_y - 10),  # Top
            (iso_x + self.grid_size // 2, iso_y + self.grid_size // 4 - 10),  # Right
            (iso_x, iso_y + self.grid_size // 2 - 10),  # Bottom
            (iso_x - self.grid_size // 2, iso_y + self.grid_size // 4 - 10)  # Left
        ]
        pygame.draw.polygon(surface, color, top_points)
        pygame.draw.polygon(surface, (100, 100, 100), top_points, 1)

    def draw(self, surface, resources):
        # Draw station background image
        surface.blit(station_bg_img, (0, 0))
        
        # Draw farm grid
        self.draw_grid(surface)
        
        # Draw buildings
        for building in self.buildings:
            self.draw_building(surface, building["type"], building["row"], building["col"])
        
        # Draw resources panel
        panel_rect = pygame.Rect(WINDOW_WIDTH - 250, 0, 250, WINDOW_HEIGHT)
        pygame.draw.rect(surface, (40, 40, 40), panel_rect)
        
        # Draw resources
        stone_text = font.render(f'Stones: {resources["stone"]}', True, BROWN)
        ice_text = font.render(f'Ice: {resources["ice"]}', True, LIGHT_BLUE)
        energy_text = font.render(f'Energy: {resources["energy"]}', True, ORANGE)
        
        screen.blit(stone_text, (WINDOW_WIDTH - 200, 50))
        screen.blit(ice_text, (WINDOW_WIDTH - 200, 90))
        screen.blit(energy_text, (WINDOW_WIDTH - 200, 130))
        
        # Draw building buttons with resource checks
        can_build_farm = resources["stone"] >= 5
        farm_button = Button(
            WINDOW_WIDTH - 200, 200,
            160, 40,
            "Build Farm (5 Stone)",
            BUTTON_COLOR if can_build_farm else GRAY,
            BUTTON_HOVER_COLOR if can_build_farm else GRAY
        )
        # Draw only the farm build button with small font
        farm_button.draw(surface, font_override=self.button_font)
        
        # Draw back and start buttons
        self.back_button.draw(surface)
        self.start_button.draw(surface)

    def handle_event(self, event):
        if self.back_button.handle_event(event):
            return MENU
        if self.start_button.handle_event(event):
            return GAME
        # Only allow building if enough resources
        if event.type == pygame.MOUSEBUTTONDOWN:
            mouse_x, mouse_y = event.pos
            # Check if click is within farm area
            if (self.offset_x - self.grid_size <= mouse_x <= self.offset_x + self.grid_width * self.grid_size and
                self.offset_y <= mouse_y <= self.offset_y + self.grid_height * self.grid_size):
                # Convert mouse position to grid coordinates
                rel_x = mouse_x - self.offset_x
                rel_y = mouse_y - self.offset_y
                col = (rel_x / (self.grid_size // 2) + rel_y / (self.grid_size // 4)) / 2
                row = (rel_y / (self.grid_size // 4) - rel_x / (self.grid_size // 2)) / 2
                col = round(col)
                row = round(row)
                if 0 <= row < self.grid_height and 0 <= col < self.grid_width:
                    # Only allow building if enough resources
                    if resources["stone"] >= 5:
                        resources["stone"] -= 5
                        self.buildings.append({"type": "farm", "row": row, "col": col})
        return STATION

class WorldMap:
    def __init__(self):
        self.back_button = Button(
            20, 20,
            BUTTON_WIDTH,
            BUTTON_HEIGHT,
            "Back to Menu",
            BUTTON_COLOR,
            BUTTON_HOVER_COLOR
        )
        self.start_button = Button(
            WINDOW_WIDTH // 2 - BUTTON_WIDTH // 2,
            WINDOW_HEIGHT // 2,
            BUTTON_WIDTH,
            BUTTON_HEIGHT,
            "Start Level",
            BUTTON_COLOR,
            BUTTON_HOVER_COLOR
        )

    def draw(self, surface):
        # Draw world map background
        surface.fill(BLACK)
        
        # Draw "World Map" title
        title = font.render("World Map", True, WHITE)
        title_rect = title.get_rect(center=(WINDOW_WIDTH/2, 50))
        screen.blit(title, title_rect)
        
        # Draw back and start buttons
        self.back_button.draw(surface)
        self.start_button.draw(surface)

    def handle_event(self, event):
        if self.back_button.handle_event(event):
            return MENU
        if self.start_button.handle_event(event):
            return GAME
        return WORLD_MAP

# Set up the game window
screen = pygame.display.set_mode((WINDOW_WIDTH, WINDOW_HEIGHT))
pygame.display.set_caption("Mars Terraformation")
clock = pygame.time.Clock()

# Font setup
font = pygame.font.Font(None, 36)

# After font setup, add this:
font = pygame.font.Font(None, 36)

start_button = Button(
    WINDOW_WIDTH // 2 - BUTTON_WIDTH // 2,
    WINDOW_HEIGHT // 2 + 60,
    BUTTON_WIDTH,
    BUTTON_HEIGHT,
    "Start Level",
    BUTTON_COLOR,
    BUTTON_HOVER_COLOR
)

# Add after font setup, define game over buttons
font = pygame.font.Font(None, 36)

gameover_menu_button = Button(
    WINDOW_WIDTH // 2 - 110, WINDOW_HEIGHT // 2 + 40, 220, 40, "Back to Main Menu", BUTTON_COLOR, BUTTON_HOVER_COLOR
)
gameover_station_button = Button(
    WINDOW_WIDTH // 2 - 110, WINDOW_HEIGHT // 2 + 90, 220, 40, "Back to Station", BUTTON_COLOR, BUTTON_HOVER_COLOR
)
gameover_tryagain_button = Button(
    WINDOW_WIDTH // 2 - 110, WINDOW_HEIGHT // 2 + 140, 220, 40, "Try Again", BUTTON_COLOR, BUTTON_HOVER_COLOR
)

# Add a flag to track lost life state
display_lost_life = False

# Initialize game state
resources = {'stone': 0, 'ice': 0, 'energy': 0}
game_started = False
game_over = False
countdown = 3
countdown_start = 0
level = 1
platforms_jumped = 0
PLATFORMS_PER_LEVEL = 30
level_complete = False
level_complete_time = 0
LEVEL_COMPLETE_DURATION = 2
lives = 3

# Create game objects
main_menu = MainMenu()
station = Station()
world_map = WorldMap()

# Create sprite groups
all_sprites = pygame.sprite.Group()
platforms = pygame.sprite.Group()
collectibles = pygame.sprite.Group()

# Initial game setup
reset_game()

# Add skip_update_after_life_loss = False to game state initialization
skip_update_after_life_loss = False

# Game loop
running = True
current_state = MENU

while running:
    # Event handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                if current_state == GAME:
                    current_state = WORLD_MAP
                elif current_state in [WORLD_MAP, STATION]:
                    current_state = MENU
            elif event.key == pygame.K_SPACE:
                if current_state == GAME:
                    if game_over:
                        reset_game()
                        game_over = False
                    elif game_started:
                        player.jump()
        elif current_state == MENU:
            new_state = main_menu.handle_event(event)
            if new_state != MENU:
                current_state = new_state
        elif current_state == STATION:
            new_state = station.handle_event(event)
            if new_state != STATION:
                current_state = new_state
                if new_state == GAME:
                    reset_game(reset_lives=True)
                    countdown = 3
                    countdown_start = time.time()
                    game_started = False
        elif current_state == WORLD_MAP:
            new_state = world_map.handle_event(event)
            if new_state != WORLD_MAP:
                current_state = new_state
                if new_state == GAME:
                    reset_game(reset_lives=True)
                    countdown = 3
                    countdown_start = time.time()
                    game_started = False
        elif current_state == GAME:
            if display_lost_life:
                if gameover_tryagain_button.handle_event(event):
                    reset_game(reset_lives=False, level_param=level)
                    display_lost_life = False
                    game_started = True  # Start the game immediately after retry
                    skip_update_after_life_loss = True
                elif gameover_station_button.handle_event(event):
                    current_state = STATION
                    display_lost_life = False
                    game_started = False
                elif gameover_menu_button.handle_event(event):
                    current_state = MENU
                    display_lost_life = False
                    game_started = False
            elif not game_started and not game_over:
                if start_button.handle_event(event):
                    countdown = 3
                    countdown_start = time.time()
                    game_started = False
            elif game_over:
                if gameover_menu_button.handle_event(event):
                    current_state = MENU
                    game_over = False
                elif gameover_station_button.handle_event(event):
                    current_state = STATION
                    game_over = False
                elif gameover_tryagain_button.handle_event(event):
                    reset_game(reset_lives=False, level_param=level)
                    game_over = False
                    countdown = 3
                    countdown_start = time.time()
                    game_started = False
            elif not display_lost_life:
                if not level_complete:
                    platform_speed, _, _ = get_level_settings(level)
                    update_result = player.update(platforms, True)
                    if update_result == "new_platform":
                        platforms_jumped += 1
                        if platforms_jumped >= PLATFORMS_PER_LEVEL and not level_complete:
                            level_complete = True
                            level_complete_time = time.time()
                            while len(platforms) < 5:
                                create_platform(level=level + 1)
                    elif update_result is True:
                        if lives > 1:
                            lives -= 1
                            display_lost_life = True
                            game_started = False
                        else:
                            game_over = True
                platforms.update(True, platform_speed)
                collectibles.update(True, platform_speed)
                collected = pygame.sprite.spritecollide(player, collectibles, True)
                for collectible in collected:
                    resources[collectible.collectible_type] += COLLECTIBLE_TYPES[collectible.collectible_type]['value']
                if len(platforms) < 5:
                    create_platform(level=level)
    # Update (always runs, not just on events)
    if current_state == GAME:
        if skip_update_after_life_loss:
            skip_update_after_life_loss = False
        elif not game_started and not game_over:
            # Handle countdown
            if countdown > 0:
                current_time = time.time()
                countdown = max(0, 3 - int(current_time - countdown_start))
                if countdown == 0:
                    game_started = True
        if game_started and not game_over:
            # Update game elements
            if not level_complete:
                platform_speed, _, _ = get_level_settings(level)
                update_result = player.update(platforms, True)
                if update_result == "new_platform":
                    platforms_jumped += 1
                    if platforms_jumped >= PLATFORMS_PER_LEVEL and not level_complete:
                        level_complete = True
                        level_complete_time = time.time()
                        while len(platforms) < 5:
                            create_platform(level=level + 1)
                elif update_result is True:
                    if lives > 1:
                        lives -= 1
                        display_lost_life = True
                        game_started = False
                    else:
                        game_over = True
                platforms.update(True, platform_speed)
                collectibles.update(True, platform_speed)
                collected = pygame.sprite.spritecollide(player, collectibles, True)
                for collectible in collected:
                    resources[collectible.collectible_type] += COLLECTIBLE_TYPES[collectible.collectible_type]['value']
                if len(platforms) < 5:
                    create_platform(level=level)
            elif level_complete:
                if time.time() - level_complete_time >= LEVEL_COMPLETE_DURATION:
                    level += 1
                    platforms_jumped = 0
                    level_complete = False
        elif not game_started and not game_over:
            player.update(platforms, False)
            platforms.update(False, 0)
            collectibles.update(False, 0)

    # Draw
    screen.fill(BLACK)
    
    if current_state == MENU:
        main_menu.draw(screen)
    elif current_state == STATION:
        station.draw(screen, resources)
    elif current_state == WORLD_MAP:
        world_map.draw(screen)
    elif current_state == GAME:
        all_sprites.draw(screen)
        
        # Draw resources and level
        level_text = font.render(f'Level: {level}', True, WHITE)
        stone_text = font.render(f'Stones: {resources["stone"]}', True, BROWN)
        ice_text = font.render(f'Ice: {resources["ice"]}', True, LIGHT_BLUE)
        energy_text = font.render(f'Energy: {resources["energy"]}', True, ORANGE)
        lives_text = font.render(f'Lives: {lives}', True, YELLOW)
        
        screen.blit(level_text, (10, 10))
        screen.blit(stone_text, (10, 50))
        screen.blit(ice_text, (10, 90))
        screen.blit(energy_text, (10, 130))
        screen.blit(lives_text, (10, 170))
        
        if countdown > 0:
            countdown_text = font.render(str(countdown), True, WHITE)
            countdown_rect = countdown_text.get_rect(center=(WINDOW_WIDTH/2, WINDOW_HEIGHT/2))
            screen.blit(countdown_text, countdown_rect)
        elif level_complete:
            complete_text = font.render(f'Level {level} finished! Congratulations!', True, WHITE)
            text_rect = complete_text.get_rect(center=(WINDOW_WIDTH/2, WINDOW_HEIGHT/2))
            screen.blit(complete_text, text_rect)
        elif game_over:
            game_over_text = font.render('Game Over!', True, WHITE)
            text_rect = game_over_text.get_rect(center=(WINDOW_WIDTH/2, WINDOW_HEIGHT/2 - 80))
            screen.blit(game_over_text, text_rect)
            # Show stats summary
            summary_text = font.render(f'You reached Level {level}!', True, YELLOW)
            summary_rect = summary_text.get_rect(center=(WINDOW_WIDTH/2, WINDOW_HEIGHT/2 - 30))
            screen.blit(summary_text, summary_rect)
            stones_text = font.render(f'Stones: {resources["stone"]}', True, BROWN)
            stones_rect = stones_text.get_rect(center=(WINDOW_WIDTH/2, WINDOW_HEIGHT/2 + 10))
            screen.blit(stones_text, stones_rect)
            ice_text = font.render(f'Ice: {resources["ice"]}', True, LIGHT_BLUE)
            ice_rect = ice_text.get_rect(center=(WINDOW_WIDTH/2, WINDOW_HEIGHT/2 + 40))
            screen.blit(ice_text, ice_rect)
            energy_text = font.render(f'Energy: {resources["energy"]}', True, ORANGE)
            energy_rect = energy_text.get_rect(center=(WINDOW_WIDTH/2, WINDOW_HEIGHT/2 + 70))
            screen.blit(energy_text, energy_rect)
            gameover_menu_button.draw(screen)
            gameover_station_button.draw(screen)
            gameover_tryagain_button.draw(screen)
        elif display_lost_life:
            screen.fill(BLACK)
            lostlife_text = font.render(f'Oh no! You lost a life! But you still have {lives} lives.', True, YELLOW)
            text_rect = lostlife_text.get_rect(center=(WINDOW_WIDTH/2, WINDOW_HEIGHT/2 - 40))
            screen.blit(lostlife_text, text_rect)
            gameover_tryagain_button.draw(screen)
            gameover_station_button.draw(screen)
            gameover_menu_button.draw(screen)
    
    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()
sys.exit() 