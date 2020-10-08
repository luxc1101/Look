import nltk
from nltk.stem.lancaster import LancasterStemmer

stemmer = LancasterStemmer()

import numpy as np
import tensorflow as tf
from tensorflow import keras
import random
import json
import pickle
from googletrans import Translator
from textblob import TextBlob

translator = Translator()

with open('intents.json') as file:
    data = json.load(file)


try:
    with open('data.pickle','rb') as f:
        words, labels, trainig, output = pickle.load(f)

except:

    words = []
    labels = []
    docs_X = []
    docs_y = []

    for intent in data['intents']:
        for pattern in intent['patterns']:
            wrds = nltk.word_tokenize(pattern)
            words.extend(wrds)
            docs_X.append(wrds)
            docs_y.append(intent['tag'])

        if intent['tag'] not in labels:
            labels.append(intent['tag'])



    words = [stemmer.stem(w.lower()) for w in words if w != "?"]
    words = sorted(list(set(words)))
    labels = sorted(labels)

    #print(words)
    print(labels)
    #print(docs_X)
    #print(docs_y)

    trainig = []
    output = []

    # out_empty = [0 for _ in range(len(labels))]

    for x,doc in enumerate(docs_X):
        bag = []

        wrds = [stemmer.stem(w) for w in doc]

        for w in words:
            if w in wrds:
                bag.append(1)
            else:
                bag.append(0)
        # output_row = out_empty[:]
        # output_row[labels.index(docs_y[x])] = 1
        # print(labels.index(docs_y[x]))

        trainig.append(bag)
        output.append(labels.index(docs_y[x]))

    trainig = np.array(trainig)
    output = np.array(output)

    with open('data.pickle', 'wb') as f:
        pickle.dump((words, labels, trainig, output), f)

print(trainig)
print(type(output))
print(trainig.shape)

model = keras.models.Sequential([
    keras.layers.Dense(10, activation='relu', input_shape = trainig.shape[1:]),
    keras.layers.Dense(10, activation='relu'),
    keras.layers.Dense(len(labels), activation='softmax'),
])

print(model.summary())

model.compile(loss="sparse_categorical_crossentropy",
              optimizer="sgd",
              metrics=["accuracy"])
checkpoint_cb = keras.callbacks.ModelCheckpoint("chatbot.h5")

try:
    model = keras.models.load_model("chatbot.h5")
except:
    history = model.fit(trainig, output, epochs=1000, batch_size=8 ,callbacks=[checkpoint_cb])
    model = keras.models.load_model("chatbot.h5")


def bag_of_words(s, words):
    bag = [0 for _ in range(len(words))]

    s_words = nltk.word_tokenize(s)
    print(s_words)
    s_words = [stemmer.stem(w.lower()) for w in s_words]


    for se in s_words:
        for i, w in enumerate(words):
            if w == se:
                print(w)
                bag[i] = 1

    return np.array(bag).reshape(1,len(bag))
def chat(inp):
    if TextBlob(inp).detect_language() != 'en':
        txt = 'sorry cant get it, why not try typing some english'
        return txt
    else:
        a = bag_of_words(s = inp, words = words)
        results = np.argmax(model.predict(a), axis=-1)
        tag = labels[results[0]]
        for tg in data['intents']:
            if tg['tag'] == tag:
                responses = tg['responses']

        return random.choice(responses)

inp = 'love you'
print(chat(inp))









