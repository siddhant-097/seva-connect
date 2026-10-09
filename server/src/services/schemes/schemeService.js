import Scheme from '../../models/Scheme.js';
import { seedSchemes } from '../../seed/schemes.js';
import { isDBConnected } from '../../config/db.js';

/**
 * SchemeService — resilient data access for schemes.
 * Uses MongoDB if connected; otherwise falls back seamlessly to official seed schemes.
 */

export async function getAllSchemes({ q, category, state, page = 1, limit = 20 } = {}) {
  if (isDBConnected) {
    try {
      const filter = { isActive: true };
      if (category && category !== 'All schemes') filter.category = category.toUpperCase();
      if (state && state !== 'ALL') filter.state = { $in: [state, 'ALL'] };
      if (q) filter.$text = { $search: q };

      const skip = (page - 1) * limit;
      const [schemes, total] = await Promise.all([
        Scheme.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        Scheme.countDocuments(filter),
      ]);

      if (total > 0) {
        return {
          schemes,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        };
      }
    } catch {
      // Fall through to in-memory seed schemes
    }
  }

  // Resilient in-memory fallback
  let list = seedSchemes.filter((s) => s.isActive !== false);

  if (category && category !== 'All schemes') {
    const catUpper = category.toUpperCase();
    list = list.filter((s) => s.category?.toUpperCase() === catUpper || s.category?.toUpperCase().includes(catUpper));
  }

  if (state && state !== 'ALL') {
    list = list.filter((s) => s.state === 'ALL' || s.state?.toLowerCase() === state.toLowerCase());
  }

  if (q) {
    const term = q.toLowerCase();
    list = list.filter((s) =>
      s.name.toLowerCase().includes(term) ||
      (s.description && s.description.toLowerCase().includes(term)) ||
      (s.category && s.category.toLowerCase().includes(term)) ||
      (s.benefits && s.benefits.toLowerCase().includes(term))
    );
  }

  const total = list.length;
  const skip = (page - 1) * limit;
  const paginated = list.slice(skip, skip + limit);

  return {
    schemes: paginated,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

export async function getSchemeById(id) {
  if (isDBConnected) {
    try {
      const found = await Scheme.findById(id);
      if (found) return found;
    } catch {
      // fallback
    }
  }
  return seedSchemes.find((s) => String(s._id) === String(id) || s.name.toLowerCase().includes(String(id).toLowerCase())) || null;
}

export async function getSchemesByIds(ids) {
  if (isDBConnected) {
    try {
      const found = await Scheme.find({ _id: { $in: ids }, isActive: true });
      if (found.length > 0) return found;
    } catch {
      // fallback
    }
  }
  const idSet = new Set(ids.map(String));
  return seedSchemes.filter((s) => idSet.has(String(s._id)));
}

export async function createScheme(data) {
  if (isDBConnected) {
    return Scheme.create(data);
  }
  const newScheme = {
    ...data,
    _id: `temp_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  seedSchemes.push(newScheme);
  return newScheme;
}

export async function updateScheme(id, data) {
  if (isDBConnected) {
    return Scheme.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }
  const index = seedSchemes.findIndex((s) => String(s._id) === String(id));
  if (index !== -1) {
    seedSchemes[index] = { ...seedSchemes[index], ...data, updatedAt: new Date() };
    return seedSchemes[index];
  }
  return null;
}
