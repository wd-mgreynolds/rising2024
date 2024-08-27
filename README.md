Extend Application
------------------
Link: https://wcpdev.wd101.myworkday.com/wdayea_wcpdev38/d/wday/app/playercentral_mcg_qndmtj/playercentral_mcg_qndmtj.htmld

User/Pass: lmcneil / 3xt3nd4Fun38!

Prism Instance
--------------
Link: https://sales100.wd99.myworkday.net/wday/authgwy/mgreygms0102v2024r1/login.htmld

User/Pass: lmcneil / {weekly sales password}

Verify Python/Git

python -V
Result: Python 3.12.0

git -v
git version 2.42.0

Install Software

mkdir pc
cd pc

python -m venv .venv

-- MacOS
. .venv/bin/activate

-- Windows
.venv\Scripts\activate


git clone https://github.com/wd-mgreynolds/rising2024.git

cd rising2024
pip install -r requirements.txt

cd player-central

-- GET extend.ini for credentials

