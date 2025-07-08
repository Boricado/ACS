// Configura CORS para permitir tu frontend
const corsOptions = {
  origin: 'https://acs-indol-three.vercel.app',
  credentials: true
};

app.use(cors(corsOptions));