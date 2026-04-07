# Frontend (React Native)

This app includes:
- Auth flow: login/register
- JWT persistence with AsyncStorage
- Providers list
- Provider details with available slots
- Book appointment
- My appointments list
- Cancel appointment

## API base URL setup

Edit `src/api/client.js` and set `BASE_URL`:
- Android emulator: `http://10.0.2.2:8000/api`
- iOS simulator: `http://localhost:8000/api`
- Physical device: `http://<your-local-ip>:8000/api`

## Install and run

```sh
npm install
npm start
npm run android
```

For iOS:

```sh
bundle install
bundle exec pod install
npm run ios
```

## Notes

- The frontend sends JWT automatically in `Authorization: Bearer <token>`.
- Loading and error states are handled on all screens.
