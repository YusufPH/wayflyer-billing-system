# Wayflyer-takehome

## The Exercise
Our core financial product is the Merchant Cash Advance (MCA), which is a form
of revenue based financing. Our customers will sell us their future sales in return
for cash now. We'll transfer them the cash directly to their bank account, then
commence billing the next day. Every day we'll charge them a pre-agreed
percentage of their previous days sales until they've paid us back the amount,
plus a small fee we charge for the service.
Write a program that interacts with the API described below that correctly bills all
our advances over the simulated period.

# Executing the program
run ```npm install``` at root of directory

run ```npm start``` to execute program

run ```npm test``` to execute tests

# TODOs
If I had more time to work on the solution I would;
- Increase test coverage
- Improve error handling, especially in the case of retrospective billing for days where revenue wasn't available
- Improve logging to reduce number of prints for tasks such as paid off advances
