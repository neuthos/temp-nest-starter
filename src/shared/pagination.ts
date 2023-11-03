import { SelectQueryBuilder } from 'typeorm';

interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  message: string;
  data: {
    content: T[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      size: number;
    };
  };
}

async function paginate<T>(
  queryBuilder: SelectQueryBuilder<T>,
  options: PaginationOptions
): Promise<PaginationResult<T>> {
  const [items, total] = await queryBuilder
    .skip((options.page - 1) * options.limit)
    .take(options.limit)
    .getManyAndCount();

  const totalPages = Math.ceil(total / options.limit);
  return {
    message: 'Berhasil',
    data: {
      content: items || [],
      pagination: {
        totalItems: total,
        totalPages,
        currentPage: options.page,
        size: options.limit,
      },
    },
  };
}

export default paginate;
