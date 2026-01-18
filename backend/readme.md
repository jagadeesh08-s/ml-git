setup ::
Min python version:: 3.9.2
cd backend


python3 -m venv venv

python3.12 -m venv venv


## MAc
source venv/bin/activate

## Windows
venv\Scripts\activate

## Deactivate
deactivate


pip install pipreqs

pipreqs . --force


pip install -r req2.txt 