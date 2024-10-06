import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { DynamoDBItem, FileUploadDto } from '@app/common';

@ApiTags('Files')
@Controller('files')
export class FilesController {
  constructor(private filesService: FilesService) {}

  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.CREATED)
  @ApiBody({
    description: 'Upload case study file',
    type: FileUploadDto,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Returns url of uploaded file',
    type: DynamoDBItem,
  })
  @ApiResponse({ status: 409, description: 'File already exists' })
  @Post('file')
  async uploadFile(
    @UploadedFile()
    file: FileUploadDto,
  ): Promise<DynamoDBItem> {
    return this.filesService.upload(file);
  }

  @ApiOperation({
    summary: `Get file by name`,
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Returns file buffer',
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @HttpCode(HttpStatus.CREATED)
  @Get(':fileName')
  findOne(@Param('fileName') fileName: string): Promise<DynamoDBItem> {
    return this.filesService.download(fileName);
  }

  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: `Update File(Replace existing file with new file)`,
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'Record updated successfully',
    type: DynamoDBItem,
  })
  @ApiBody({
    description: 'Upload case study file',
    type: FileUploadDto,
  })
  @ApiResponse({ status: 404, description: 'File Not found' })
  @HttpCode(HttpStatus.ACCEPTED)
  @Patch(':fileName')
  update(
    @Param('fileName') fileName: string,
    @UploadedFile() file: FileUploadDto,
  ): Promise<DynamoDBItem> {
    return this.filesService.update(fileName, file);
  }

  @ApiOperation({
    summary: `Delete file`,
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Record deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'File Not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':name')
  remove(@Param('name') fileName: string) {
    return this.filesService.delete(fileName);
  }
}
