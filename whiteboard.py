from flask import Flask, render_template, redirect, request
import string
import random

app = Flask(__name__)


@app.route('/')
def home():
    return render_template('index.html')

@app.route('/whiteboard')
def whiteboard():
    args=request.args
    return render_template('whiteboard.html', room=args.get("room"))

@app.route('/newWhiteboard')
def newWhiteboard():
    s=''
    s=s.join(random.SystemRandom().choice(string.ascii_uppercase + string.digits + string.ascii_lowercase) for _ in range(20))
    return redirect('whiteboard?room='+s)

if __name__ == "__main__":
    app.run(host='0.0.0.0')