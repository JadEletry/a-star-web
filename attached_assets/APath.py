# H score is an estimate of distance from one node to the end. (Current to end)
# G score is the current shortest distance from the start node to the current node you're at. (Beginneing to Current)
# F score is the addition of both H and G scores. ----> F(n) = G(n) + H(n)
# It is an estimate for how far away we are from the end node.
# Open set carries the queue for our nodes and the distance to them.
# Once all paths are conisdered, pop the shortest path out of the open set.


import pygame, sys
import math
import time
from queue import PriorityQueue
mainClock = pygame.time.Clock()
from pygame.locals import *

WIDTH = 1000
WIN = pygame.display.set_mode((WIDTH, WIDTH))

RED = (255, 153, 153)
BLUE = (153, 204, 255)
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
GREY = (128, 128, 128)
GREEN = (0, 255 ,0)
YELLOW = (255, 255, 0)


class Node:
    def __init__(self, row, col, width, total_rows):
        pygame.init()
        self.running, self.playing = True, False
        self.row = row
        self.col = col
        self.x = row * width
        self.y = col * width
        self.color = WHITE
        self.neighbors =[]
        self.width = width
        self.total_rows = total_rows

    def get_pos(self):
        return self.row, self.col

    # Is the certain spot closed (red / already looked at) 
    def is_closed(self):
        return self.color == RED

    def is_open(self):
        return self.color == BLUE

    def is_barrier(self):
        return self.color == BLACK

    def is_start(self):
        return self.color == GREEN

    def is_end(self):
        return self.color == YELLOW

    def reset(self):
        self.color = WHITE

    def make_start(self):
        self.color = GREEN

    def make_closed(self): 
        self.color = RED

    def make_open(self):
        self.color = BLUE

    def make_barrier(self): 
        self.color = BLACK

    def make_end(self):
        self.color = YELLOW

    def make_path(self):
        self.color = GREY

    def draw(self, window):
        pygame.draw.rect(window, self.color, (self.x, self.y, self.width, self.width))

    # This function checks from the start node whether or not the blocks
    # Next to it are neighbors (not barriers) and adds it to a neighbors list
    def update_neighbors(self, grid):
        self.neighbors = []

        # Check to see if you can move through the grid --> Does it exceed the set grid limit & is it a barrier?
        if self.row < self.total_rows - 1 and not grid[self.row + 1][self.col].is_barrier(): # DOWN
            self.neighbors.append(grid[self.row + 1][self.col]) 

        if self.row > 0 and not grid[self.row - 1][self.col].is_barrier(): # UP 
            self.neighbors.append(grid[self.row - 1][self.col])

        if self.col < self.total_rows - 1 and not grid[self.row][self.col + 1].is_barrier(): # RIGHT
            self.neighbors.append(grid[self.row][self.col + 1])

        if self.col > 0 and not grid[self.row][self.col - 1].is_barrier(): # LEFT
            self.neighbors.append(grid[self.row][self.col - 1])

    # Compares two nodes
    def __lt__(self, other):
        return False


# Distance calculated as Manhattan Distance between two nodes 
def h(p1, p2):
    x1, y1 = p1
    x2, y2 = p2
    return abs(x1 - x2) + abs(y1 - y2)

def reconstruct_path(came_from, current, draw):
    # From end node, current node is whatever node we came from
    # That current node is then part of the path, then draw it and keep doing that
    while current in came_from:
        current = came_from[current]
        current.make_path()
        draw()

def algorithm(draw, grid, start, end):
    count = 0
    open_set = PriorityQueue()
    open_set.put((0, count, start))  # <---- Our open set
    came_from = {}
    g_score = {node: float("inf") for row in grid for node in row}
    g_score[start] = 0
    f_score = {node: float("inf") for row in grid for node in row}
    f_score[start] = h(start.get_pos(), end.get_pos())

    open_set_hash = {start}
    
    # Throw an error handler in the event that the user wants to quit
    while not open_set.empty():
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
        
        # Indexing at 2 because our open set stores
        # The F score, count, node
        # We only want the node
        current = open_set.get()[2]
        open_set_hash.remove(current) 

        # If the node we just pulled out is the end node, 
        # Then the shortest path has been found
        # Algorithm then runs to draw that path
        if current == end:
            reconstruct_path(came_from, end, draw)
            start.make_start()
            end.make_end()
            return True

        # Now consider the neighbors of the current node
        for neighbor in current.neighbors:
            temp_g_score = g_score[current] + 1

            # Calculates the temporary G score of the neighbors
            # If it is less than the G score in the table
            # Update it becaue it's a better path
            # Add it into the open set if not already in
            if temp_g_score < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = temp_g_score
                f_score[neighbor] = temp_g_score + h(neighbor.get_pos(), end.get_pos())
                if neighbor not in open_set_hash:
                    count += 1
                    open_set.put((f_score[neighbor], count, neighbor))
                    open_set_hash.add(neighbor)
                    neighbor.make_open()
        
        draw()

        if current != start:
            current.make_closed()

    return False

def make_grid(rows, width):
    grid = []
    gap = width // rows # Width of each cube
    for i in range(rows):
        grid.append([])
        for j in range(rows):
            node = Node(i, j, gap, rows)
            grid[i].append(node)

    return grid

# Draw the grid lines
def draw_grid(window, rows, width):
	gap = width // rows
	for i in range(rows):
		pygame.draw.line(window, GREY, (0, i * gap), (width, i * gap))
		for j in range(rows):
				pygame.draw.line(window, GREY, (j * gap, 0), (j * gap, width))

def draw(window, grid, rows, width):
	window.fill(WHITE)

	for row in grid:
		for node in row:
			node.draw(window)

	draw_grid(window, rows, width)
	pygame.display.update()

def get_clicked_position(pos, rows, width):
    gap = width // rows
    y, x = pos

    row = y // gap
    col = x // gap
    return row, col

def main(window, width):
    ROWS = 25
    grid = make_grid(ROWS, width)

    start = None
    end = None

    run = True
    started = False

    while run:
        draw(window, grid, ROWS, width)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                run = False

            # While the algorithm hasn't started disallow user clicks
            if started:
                continue

            if pygame.mouse.get_pressed()[0]: # LEFT MOUSE BUTTON
                pos = pygame.mouse.get_pos()
                row, col = get_clicked_position(pos, ROWS, width)
                node = grid[row][col]
                if not start and node != end:
                    start = node
                    start.make_start()
                
                elif not end and node != start:
                    end = node
                    end.make_end()
        
                elif node != start and node != end:
                    node.make_barrier()

            elif pygame.mouse.get_pressed()[2]: # RIGHT MOUSE BUTTON (SCROLL WHEEL IS 1)
                pos = pygame.mouse.get_pos()
                row, col = get_clicked_position(pos, ROWS, width)
                node = grid[row][col]
                node.reset()
                if node == start:
                    start = None
                elif node == end:
                    end = None

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_SPACE and not started:
                    for row in grid:
                        for node in row:
                            node.update_neighbors(grid)

                    algorithm(lambda: draw(window, grid, ROWS, width), grid, start, end)
                                
    pygame.quit()

main(WIN, WIDTH)
