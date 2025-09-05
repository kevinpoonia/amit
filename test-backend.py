import os
import sys
import time
import subprocess

def main():
    # Change to the backend directory
    os.chdir('backend')
    
    # Install dependencies
    print("Installing dependencies...")
    subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
    
    # Start the server
    print("Starting the server...")
    subprocess.run([sys.executable, 'server.js'])

if __name__ == '__main__':
    main()