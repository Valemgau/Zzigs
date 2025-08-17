import firestore from '@react-native-firebase/firestore';
import Purchases from 'react-native-purchases';

// Récupération du nom du plan actif depuis RevenueCat
export async function getActivePlanKey() {
  const customerInfo = await Purchases.getCustomerInfo();
  if (customerInfo?.entitlements?.active?.premium) return 'premium';
  if (customerInfo?.entitlements?.active?.pro) return 'pro';
  return 'gratuit';
}

// Récupère les features du plan courant depuis Firestore
export async function getPlanFeaturesFS() {
  const docSnap = await firestore()
    .collection('app_config')
    .doc('plan_features')
    .get();
  const data = docSnap.exists ? docSnap.data() : {};
  const planKey = await getActivePlanKey();
  return data[planKey] || {};
}

// Vérifie si la feature est accessible (quota pas dépassé ou illimité)
export async function checkFeatureAccessFS(userId, featureKey) {
  const features = await getPlanFeaturesFS();
  const limit = features[featureKey];
  if (limit === null || limit === undefined) return true;

  const today = new Date().toISOString().slice(0, 10);
  const usageQuery = await firestore()
    .collection('usage_logs')
    .where('user_id', '==', userId)
    .where('feature_key', '==', featureKey)
    .where('date', '==', today)
    .get();

  let usedCount = 0;
  if (!usageQuery.empty) {
    usedCount = usageQuery.docs[0].data().used_count || 0;
  }
  return usedCount < limit;
}

// Incrémente le compteur d'usage pour une feature
export async function incrementFeatureUsageFS(userId, featureKey) {
  const today = new Date().toISOString().slice(0, 10);
  const usageLogsRef = firestore().collection('usage_logs');
  const usageQuery = await usageLogsRef
    .where('user_id', '==', userId)
    .where('feature_key', '==', featureKey)
    .where('date', '==', today)
    .get();

  if (usageQuery.empty) {
    await usageLogsRef.add({
      user_id: userId,
      feature_key: featureKey,
      used_count: 1,
      date: today,
    });
  } else {
    const docRef = usageQuery.docs[0].ref;
    await docRef.update({
      used_count: firestore.FieldValue.increment(1),
    });
  }
}
