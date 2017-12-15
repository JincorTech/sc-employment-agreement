# sc-employment-agreement
Employment agreement smart contract for backend app.

## How to setup development environment and run tests?

1. Install `docker` if you don't have it.
1. Clone this repo.
1. Run `docker-compose build --no-cache`.
1. Run `docker-compose up -d`. 
1. Install dependencies: `docker-compose exec workspace yarn`.
1. To run tests: `docker-compose exec workspace truffle test`.
1. To merge your contracts via sol-merger run: `docker-compose exec workspace yarn merge`.
Merged contracts will appear in `merge` directory.