export const Home: React.FC = () => {
  return (
    <section>
      <h1>Welcome to a awesome Vite + React template </h1>
      <div className='logo'>
        <img src='/logo.svg' alt='react logo' />
      </div>
      <h3>Getting start:</h3>
      <div className='wrapper__button'>
        <a href='https://vitejs.dev/' rel='noopener noreferrer' target='_blank'>
          Vite
        </a>
        <a href='https://react.dev/' rel='noopener noreferrer' target='_blank'>
          React
        </a>
      </div>
    </section>
  )
}
