## Browser Live View Example
This Actor provides a proof-of-concept implementation of a browser live view using Playwright. It launches a Playwright crawler and streams the browser's state in real time, allowing you to interact with the browser as if it were a local browser.

Currently, the Actor can only open and show one web page. When the webpage is opened the crawler waits for 20 minutes and then closes the browser. The crawler can be stopped at any time by pressing the "Abort" button.

### How to use the Actor
1. Start the Actor. As input select which webpage to open and which proxy to use.
2. Wait for the Actor to start the browser and the proxy server.
3. Open the container URL in your browser. The Live View tab should also work but isn't tested.
4. Interact with the browser as you would with a local browser.

### How it works
The Actor starts a proxy server for the browser CDP server. The frontend code can then connect to the proxied web socket and control the browser via CDP.

The frontend code then starts a screencast stream from the browser and displays it in a image element. Also the frontend code listens to mouse and keyboard events on the image element to transmit them back to the CDP server to provide the interactivity.

### Not implemented features
The design of the proxy server allows for streaming live interactive view from multiple tabs or crawler requests.
