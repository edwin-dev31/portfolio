import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar la clave de servicio
const serviceAccountPath = join(__dirname, '../portfolio-31e-firebase-adminsdk-fbsvc-7a3ffa82f9.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

// Inicializar Firebase Admin con la clave de servicio
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function verifyFirestoreStructure() {
  console.log('🔍 Verificando estructura de Firestore...\n');
  console.log('Proyecto:', serviceAccount.project_id);
  console.log('=' .repeat(70));

  try {
    // Listar todas las colecciones en la raíz
    const collections = await db.listCollections();
    
    if (collections.length === 0) {
      console.log('\n⚠️  No se encontraron colecciones en Firestore');
    } else {
      console.log(`\n✅ Se encontraron ${collections.length} colección(es):\n`);
      
      for (const collection of collections) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`� COLECCIÓN: ${collection.id}`);
        console.log('='.repeat(70));
        
        // Obtener todos los documentos de la colección
        const snapshot = await collection.get();
        
        if (snapshot.empty) {
          console.log('   ⚠️  Colección vacía (sin documentos)');
        } else {
          console.log(`   ✅ ${snapshot.size} documento(s) encontrado(s)\n`);
          
          for (const doc of snapshot.docs) {
            console.log(`   📄 Documento ID: "${doc.id}"`);
            console.log('   ' + '-'.repeat(66));
            
            const data = doc.data();
            console.log('   Estructura:');
            console.log(JSON.stringify(data, null, 3).split('\n').map(line => '   ' + line).join('\n'));
            
            console.log('\n   📋 Campos principales:', Object.keys(data).join(', '));
            
            // Verificar si hay subcolecciones
            const subcollections = await doc.ref.listCollections();
            if (subcollections.length > 0) {
              console.log('   📂 Subcolecciones:', subcollections.map(sc => sc.id).join(', '));
            }
            
            console.log('');
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Análisis completado\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

verifyFirestoreStructure().catch(console.error);
