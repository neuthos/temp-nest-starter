import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Supplier } from './entities/suppliers.entity';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly supplierService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  create(@Body() supplierData: Partial<Supplier>): Promise<Supplier> {
    return this.supplierService.create(supplierData);
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of suppliers' })
  @ApiResponse({
    status: 200,
    description: 'List of suppliers retrieved successfully',
  })
  findAll(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('name') name: string,
    @Query('start') start: Date,
    @Query('end') end: Date
  ): Promise<{ suppliers: Supplier[]; total: number }> {
    return this.supplierService.findAll(page, limit, name, start, end);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a supplier by ID' })
  @ApiResponse({ status: 200, description: 'Supplier retrieved successfully' })
  findOne(@Param('id') id: string): Promise<Supplier> {
    return this.supplierService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a supplier by ID' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  update(
    @Param('id') id: string,
    @Body() supplierData: Partial<Supplier>
  ): Promise<Supplier> {
    return this.supplierService.update(id, supplierData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier by ID' })
  @ApiResponse({ status: 204, description: 'Supplier deleted successfully' })
  remove(@Param('id') id: string): Promise<void> {
    return this.supplierService.remove(id);
  }
}
