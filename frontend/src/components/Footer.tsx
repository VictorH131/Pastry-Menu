export default function Footer({ unavailable }: { unavailable: (feature: string) => void }) {
  return <footer style={{ textAlign: 'center', padding: '32px 16px', borderTop: '1px solid #ddd' }}>
    <strong>Pastry Menu</strong> · Mais organização. Menos complicação.{' '}
    <button onClick={() => unavailable('Contato')}>Contato</button>
  </footer>;
}
