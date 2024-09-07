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
Create a directory for Player Central on the local device.

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
    extend.ini

## Create the Python virtual environment

Python virtual environments allow you to install Python packages in a location isolated from the rest of your system instead of installing them system-wide.  Using virtual environments makes it very easy to remove all traces of Player Central without affecting other Python activities.

***IMPORTANT:*** Only setup the virtual environment once during initial installation.

Please note the period (.) on the last parameter - this must be {dot}venv.

***Windows***

    c:\pc> python -m venv .venv

***MacOS / Linux***

    user@machine pc % python -m venv .venv

## Activate the virtual environment

Virtual environments must be activated before installing or using Player Central.

**IMPORTANT**: The activate step MUST be preformed from the same directory of the virtual environment command (see above), e.g., c:\pc> directory.

***Windows***

Note the leading period of the *.venv* command.

    c:\pc> .venv\Scripts\activate

***MacOS***

Note the leading period of the *.venv* command.

<pre>
user@machine pc % <b>source .venv</b>/bin/activate
</pre>

## Get Player Central from GitHub

The following command retrieves the Player Cental Python application from the GitHub repository.

<pre>
c:\pc> <b>git clone</b> https://github.com/wd-mgreynolds/rising2024.git
</pre>

Results:

<pre>
<b>Cloning into 'rising2024'...</b>
remote: Enumerating objects: 195, done.
remote: Counting objects: 100% (195/195), done.remote: Compressing objects: 100% (157/157), done.
remote: Total 195 (delta 49), reused 181 (delta 35), pack-reused 0 (from 0)
Receiving objects: 100% (195/195), 7.57 MiB | 15.71 MiB/s, done.
Resolving deltas: 100% (49/49), done.
</pre>

A new directory has been created - switch to the new directory.

    c:\pc> cd rising2024

## Install required Python packages

Player Central requires specific Python packages (libraries) to be available.  Install them into the virtural environment.

<pre>
c:\pc\rising2024> <b>pip install</b> -r requirements.txt
</pre>

A number of messages should go by indicating the packages are being installed.

***IMPORTANT:*** Only use the **pip** command when setting up the initial environment.

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

# What happens next...

To restart Player Central ensure to set the Python virtual environment before starting the process.

For example:

***Windows***

    {start terminal}
    c:\> cd pc
    c:\pc> .venv\Scripts\activate
    c:\pc> cd rising2024
    c:\pc\rising2024> start-pc

***Linux***

    {start terminal}
    user@machine ~ % cd pc
    user@machine pc % . .venv/bin/activate
    user@machine pc % cd rising2024
    user@machine rising2024 % ./start-pc.sh

# Updating Player Central from Github

Use the following Git **pull** command to update the environment with updates from Git.

**IMPORTANT**: The Git command is run from the **rising2024** directory.

***Windows***

<pre>
{start terminal}
c:\> cd pc
c:\pc> .venv\Scripts\activate
c:\pc> cd <b>rising2024</b>
c:\pc\rizing2024> git pull https://github.com/wd-mgreynolds/rising2024.git
c:\pc\rising2024> start-pc
</pre>

***Linux***

<pre>
{start terminal}
user@machine ~ % cd pc
user@machine pc % . .venv/bin/activate
user@machine pc % cd <b>rising2024</b>
user@machine rising2024 % git pull https://github.com/wd-mgreynolds/rising2024.git
user@machine rising2024 % ./start-pc.sh
</pre>