# 1. Workday Tenants

## Extend Application

Link: https://wcpdev.wd101.myworkday.com/wdayea_wcpdev38/d/wday/app/playercentral_mcg_qndmtj/playercentral_mcg_qndmtj.htmld

User/Pass: lmcneil / {wdayea_wcpdev38 password}

## Prism Instance

Link: https://sales100.wd99.myworkday.net/wday/authgwy/mgreygms0102v2024r1/login.htmld

User/Pass: lmcneil / {weekly sales password}

## Credentials

Locate the **`extend.ini`** file containing the Extend credentials.

For example:

    [extend]
    server: api.workday.com
    app: playercentral_mcg_qndmtj

    tenant_alias: wdayea_wcpdev38

    client_id: {client id from Extend API }
    client_secret: {client secret from Extend API}

# 2. Software Requirements

Verify Python and Git are available at the command line.

## Python

**Windows**

    c:\> python -V

or

**MacOS / Linux**

    user@machine ~ % python -V

Result: **Python 3.12.0**

## Git Client

**Windows**

    c:\> git -v

**MacOS / Linux**

    user@machine ~ % git -v

Result: **git version 2.42.0**

# 3. Install Player Central

## Create a directory
Create a diretory for Player Central on the local device.

**Windows**

    c:\> mkdir pc

**MacOS / Linux**

    user@machine ~ % mkdir pc

Switch to the new directory to continue.

    cd pc

## Copy the extend.ini file

Copy the **`extend.ini`** file with credentials into this directory.  Ensure the file is present by listing the directory contents.

***Windows***

    c:\pc> dir

***MacOS / Linux***

    user@machine pc % ls   
    extend.ini	rising2024

## Create the Python virtual environment

Please note the period (.) on the last parameter - this must be {dot}venv.

***Windows***

    c:\pc> python -m venv .venv

***MacOS / Linux***

    user@machine pc % python -m venv .venv

## Activate the virtual environment

Virtual environments must be activated before installing or using Player Central.

***Windows***

Note the leading period and space before the *.venv* command.

    c:\pc> .venv\Scripts\activate

***MacOS***

Note both the leading **period and space** before the *.venv* command and the period before **venv**.

    user@machine pc % . .venv/bin/activate

## Get Player Central from GitHub

The following command retrieves the Player Cental Python application from the GitHub repository.

    git clone https://github.com/wd-mgreynolds/rising2024.git

Results:

    Cloning into 'rising2024'...
    remote: Enumerating objects: 195, done.
    remote: Counting objects: 100% (195/195), done.
    remote: Compressing objects: 100% (157/157), done.
    remote: Total 195 (delta 49), reused 181 (delta 35), pack-reused 0 (from 0)
    Receiving objects: 100% (195/195), 7.57 MiB | 15.71 MiB/s, done.
    Resolving deltas: 100% (49/49), done.

A new directory has been created - switch to the new directory.

    c:\pc> cd rising2024

## Install required Python packages

Player Central requires specific Python packages (libraries) to be available.  Install them into the virtural environment.

    c:\pc\rising2024> pip install -r requirements.txt

A number of messages should go by indicating the packages are being installed.

## Start Player Central

***Windows***

    c:\pc\rising2024> start-pc

***MacOS / Linux***

    user@machine rising2024 % ./start-pc.sh

Do not close the current this window.

     * Serving Flask app 'player-central/player-central.py'
    * Debug mode: off
    WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.
    * Running on all addresses (0.0.0.0)
    * Running on http://127.0.0.1:8000
    * Running on http://10.78.144.120:8000
    Press CTRL+C to quit

# Access the Player Console

    http://localhost:8000