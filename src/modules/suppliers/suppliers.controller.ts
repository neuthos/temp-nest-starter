import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { HeaderParam } from '@/shared/interfaces';
import { Supplier } from './entities/suppliers.entity';
import { SuppliersService } from './suppliers.service';

@ApiTags('suppliers')
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly supplierService: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new supplier' })
  @ApiResponse({ status: 201, description: 'Supplier created successfully' })
  create(
    @Headers() header: HeaderParam,
    @Body() supplierData: Partial<Supplier>
  ): Promise<Supplier> {
    return this.supplierService.create(header.companyId, supplierData);
  }

  @Get()
  @ApiOperation({ summary: 'Get a list of suppliers' })
  @ApiResponse({
    status: 200,
    description: 'List of suppliers retrieved successfully',
  })
  findAll(
    @Headers() header: HeaderParam,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('name') name: string,
    @Query('status') status: string,
    @Query('type') type: string
  ) {
    return this.supplierService.findAll(
      header.companyId,
      page,
      limit,
      name,
      status,
      type
    );
  }

  @Get('default')
  @ApiOperation({ summary: 'Get a list of default suppliers' })
  @ApiResponse({
    status: 200,
    description: 'List of suppliers retrieved successfully',
  })
  defaultSupplier() {
    return this.supplierService.defaultSupplier();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a supplier by ID' })
  @ApiResponse({ status: 200, description: 'Supplier updated successfully' })
  update(
    @Headers() header: HeaderParam,
    @Param('id') id: string,
    @Body() supplierData: Partial<Supplier>
  ): Promise<Supplier> {
    return this.supplierService.update(header.companyId, id, supplierData);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a supplier by ID' })
  @ApiResponse({ status: 204, description: 'Supplier deleted successfully' })
  remove(@Headers() header: HeaderParam, @Param('id') id: string) {
    return this.supplierService.remove(id, header.companyId);
  }

  @Patch('update-status/:id')
  updateSupplierStatus(
    @Headers() header: HeaderParam,
    @Param('id') id: string,
    @Body() body: { status: number }
  ) {
    return this.supplierService.updateSupplierStatus(
      header.companyId,
      id,
      body.status
    );
  }
}
