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

